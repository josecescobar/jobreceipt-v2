import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PunchListsService } from '../punch-lists/punch-lists.service';
import { S3Service } from '../../common/services/s3.service';
import { CloseOutChecklistItemStatus } from '@prisma/client';

const DEFAULT_CHECKLIST_ITEMS = [
  'All punch list items resolved',
  'Final walkthrough completed',
  'Customer sign-off obtained',
  'Final invoice sent / all invoices paid',
  'Lien waivers collected',
  'Final inspection / permit close-out',
  'As-built documents uploaded',
  'Warranty documents provided',
  'Job site cleaned and restored',
  'Equipment and tools retrieved',
];

@Injectable()
export class CloseOutService {
  constructor(
    private prisma: PrismaService,
    private punchListsService: PunchListsService,
    private s3: S3Service,
  ) {}

  async initiate(
    orgId: string,
    userId: string,
    jobId: string,
    customItems?: string[],
  ) {
    // Verify job exists and is ACTIVE
    const job = await this.prisma.job.findFirst({
      where: { id: jobId, organizationId: orgId },
    });
    if (!job) throw new NotFoundException('Job not found');
    if (job.status !== 'ACTIVE') {
      throw new BadRequestException('Job must be ACTIVE to initiate close-out');
    }

    // Check no existing close-out
    const existing = await this.prisma.jobCloseOut.findUnique({
      where: { jobId },
    });
    if (existing) {
      throw new ConflictException('Close-out already exists for this job');
    }

    // Build checklist items
    const allLabels = [...DEFAULT_CHECKLIST_ITEMS, ...(customItems ?? [])];
    const checklistData = allLabels.map((label, index) => ({
      label,
      sortOrder: index,
      status: CloseOutChecklistItemStatus.PENDING,
    }));

    // Create close-out with checklist items
    const closeOut = await this.prisma.jobCloseOut.create({
      data: {
        job: { connect: { id: jobId } },
        organization: { connect: { id: orgId } },
        initiatedBy: { connect: { id: userId } },
        checklistItems: {
          create: checklistData,
        },
      },
      include: {
        checklistItems: { orderBy: { sortOrder: 'asc' } },
        initiatedBy: { select: { id: true, name: true } },
      },
    });

    // Auto-check punch list (item #1, sortOrder 0)
    try {
      const punchSummary = await this.punchListsService.getJobSummary(
        orgId,
        jobId,
      );
      if (
        punchSummary.total > 0 &&
        punchSummary.open === 0 &&
        punchSummary.inProgress === 0
      ) {
        const punchItem = closeOut.checklistItems.find(
          (i) => i.sortOrder === 0,
        );
        if (punchItem) {
          await this.prisma.closeOutChecklistItem.update({
            where: { id: punchItem.id },
            data: {
              status: CloseOutChecklistItemStatus.COMPLETE,
              completedAt: new Date(),
              completedById: userId,
            },
          });
          await this.prisma.jobCloseOut.update({
            where: { id: closeOut.id },
            data: { punchListCleared: true },
          });
        }
      }
    } catch {
      // If punch list check fails, continue silently
    }

    // Auto-check invoices (item #4, sortOrder 3)
    try {
      const outstandingInvoices = await this.prisma.invoice.count({
        where: {
          jobId,
          organizationId: orgId,
          status: { not: 'PAID' },
        },
      });
      if (outstandingInvoices === 0) {
        // Check there are invoices at all
        const totalInvoices = await this.prisma.invoice.count({
          where: { jobId, organizationId: orgId },
        });
        if (totalInvoices > 0) {
          const invoiceItem = closeOut.checklistItems.find(
            (i) => i.sortOrder === 3,
          );
          if (invoiceItem) {
            await this.prisma.closeOutChecklistItem.update({
              where: { id: invoiceItem.id },
              data: {
                status: CloseOutChecklistItemStatus.COMPLETE,
                completedAt: new Date(),
                completedById: userId,
              },
            });
            await this.prisma.jobCloseOut.update({
              where: { id: closeOut.id },
              data: { invoicesPaid: true },
            });
          }
        }
      }
    } catch {
      // If invoice check fails, continue silently
    }

    // Re-fetch with updated data
    return this.prisma.jobCloseOut.findUnique({
      where: { id: closeOut.id },
      include: {
        checklistItems: { orderBy: { sortOrder: 'asc' } },
        initiatedBy: { select: { id: true, name: true } },
      },
    });
  }

  async getByJob(orgId: string, jobId: string) {
    const closeOut = await this.prisma.jobCloseOut.findFirst({
      where: { jobId, organizationId: orgId },
      include: {
        checklistItems: {
          orderBy: { sortOrder: 'asc' },
          include: {
            completedBy: { select: { id: true, name: true } },
          },
        },
        initiatedBy: { select: { id: true, name: true } },
      },
    });

    if (!closeOut) throw new NotFoundException('Close-out not found for this job');

    const total = closeOut.checklistItems.length;
    const completed = closeOut.checklistItems.filter(
      (i) => i.status === 'COMPLETE',
    ).length;
    const waived = closeOut.checklistItems.filter(
      (i) => i.status === 'WAIVED',
    ).length;
    const pending = total - completed - waived;
    const percent =
      total > 0 ? Math.round(((completed + waived) / total) * 100) : 0;

    return {
      ...closeOut,
      progress: { total, completed, waived, pending, percent },
    };
  }

  async updateChecklistItem(
    orgId: string,
    itemId: string,
    userId: string,
    data: { status: string; notes?: string },
  ) {
    const item = await this.prisma.closeOutChecklistItem.findFirst({
      where: { id: itemId },
      include: {
        closeOut: { select: { organizationId: true } },
      },
    });

    if (!item || item.closeOut.organizationId !== orgId) {
      throw new NotFoundException('Checklist item not found');
    }

    const updateData: any = {
      status: data.status as CloseOutChecklistItemStatus,
    };

    if (data.status === 'COMPLETE') {
      updateData.completedAt = new Date();
      updateData.completedById = userId;
    } else {
      updateData.completedAt = null;
      updateData.completedById = null;
    }

    if (data.notes !== undefined) {
      updateData.notes = data.notes;
    }

    return this.prisma.closeOutChecklistItem.update({
      where: { id: itemId },
      data: updateData,
      include: {
        completedBy: { select: { id: true, name: true } },
      },
    });
  }

  async updateCloseOut(
    orgId: string,
    closeOutId: string,
    data: {
      walkthroughDate?: string;
      walkthroughNotes?: string;
      customerSignedName?: string;
    },
  ) {
    const closeOut = await this.prisma.jobCloseOut.findFirst({
      where: { id: closeOutId, organizationId: orgId },
    });

    if (!closeOut) throw new NotFoundException('Close-out not found');

    const updateData: any = {};
    if (data.walkthroughDate !== undefined) {
      updateData.walkthroughDate = new Date(data.walkthroughDate);
    }
    if (data.walkthroughNotes !== undefined) {
      updateData.walkthroughNotes = data.walkthroughNotes;
    }
    if (data.customerSignedName !== undefined) {
      updateData.customerSignedName = data.customerSignedName;
    }

    return this.prisma.jobCloseOut.update({
      where: { id: closeOutId },
      data: updateData,
      include: {
        checklistItems: { orderBy: { sortOrder: 'asc' } },
        initiatedBy: { select: { id: true, name: true } },
      },
    });
  }

  async getSignatureUploadUrl(orgId: string, closeOutId: string) {
    const closeOut = await this.prisma.jobCloseOut.findFirst({
      where: { id: closeOutId, organizationId: orgId },
    });

    if (!closeOut) throw new NotFoundException('Close-out not found');

    const key = `close-out-signatures/${orgId}/${closeOutId}/signature.png`;
    const { url } = await this.s3.generateUploadUrl(key, 'image/png');

    return { url, key };
  }

  async saveSignature(
    orgId: string,
    closeOutId: string,
    signatureKey: string,
    customerName: string,
  ) {
    const closeOut = await this.prisma.jobCloseOut.findFirst({
      where: { id: closeOutId, organizationId: orgId },
      include: {
        checklistItems: { orderBy: { sortOrder: 'asc' } },
      },
    });

    if (!closeOut) throw new NotFoundException('Close-out not found');

    // Update close-out with signature data
    await this.prisma.jobCloseOut.update({
      where: { id: closeOutId },
      data: {
        customerSignature: signatureKey,
        customerSignedName: customerName,
        customerSignedAt: new Date(),
      },
    });

    // Mark checklist item #3 ("Customer sign-off obtained", sortOrder 2) as COMPLETE
    const signOffItem = closeOut.checklistItems.find(
      (i) => i.sortOrder === 2,
    );
    if (signOffItem && signOffItem.status !== 'COMPLETE') {
      await this.prisma.closeOutChecklistItem.update({
        where: { id: signOffItem.id },
        data: {
          status: CloseOutChecklistItemStatus.COMPLETE,
          completedAt: new Date(),
        },
      });
    }

    return this.prisma.jobCloseOut.findUnique({
      where: { id: closeOutId },
      include: {
        checklistItems: { orderBy: { sortOrder: 'asc' } },
        initiatedBy: { select: { id: true, name: true } },
      },
    });
  }

  async completeCloseOut(orgId: string, closeOutId: string, userId: string) {
    const closeOut = await this.prisma.jobCloseOut.findFirst({
      where: { id: closeOutId, organizationId: orgId },
      include: {
        checklistItems: true,
      },
    });

    if (!closeOut) throw new NotFoundException('Close-out not found');

    // Verify ALL items are COMPLETE or WAIVED
    const pendingItems = closeOut.checklistItems.filter(
      (i) => i.status === 'PENDING',
    );
    if (pendingItems.length > 0) {
      throw new BadRequestException(
        `${pendingItems.length} checklist item(s) are still pending. Complete or waive all items before closing out.`,
      );
    }

    // Use transaction to mark close-out complete and update job status
    return this.prisma.$transaction(async (tx) => {
      const updatedCloseOut = await tx.jobCloseOut.update({
        where: { id: closeOutId },
        data: { completedAt: new Date() },
        include: {
          checklistItems: { orderBy: { sortOrder: 'asc' } },
          initiatedBy: { select: { id: true, name: true } },
        },
      });

      await tx.job.update({
        where: { id: closeOut.jobId },
        data: { status: 'COMPLETED' },
      });

      return updatedCloseOut;
    });
  }

  async getProgress(orgId: string, jobId: string) {
    const closeOut = await this.prisma.jobCloseOut.findFirst({
      where: { jobId, organizationId: orgId },
      include: {
        checklistItems: true,
      },
    });

    if (!closeOut) {
      return {
        total: 0,
        completed: 0,
        waived: 0,
        pending: 0,
        percent: 0,
        isComplete: false,
      };
    }

    const total = closeOut.checklistItems.length;
    const completed = closeOut.checklistItems.filter(
      (i) => i.status === 'COMPLETE',
    ).length;
    const waived = closeOut.checklistItems.filter(
      (i) => i.status === 'WAIVED',
    ).length;
    const pending = total - completed - waived;
    const percent =
      total > 0 ? Math.round(((completed + waived) / total) * 100) : 0;
    const isComplete = closeOut.completedAt !== null;

    return { total, completed, waived, pending, percent, isComplete };
  }
}
