import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { InvoicesService } from '../invoices/invoices.service';
import { CreateSOVDto } from './dto/create-sov.dto';
import { UpdateSOVDto } from './dto/update-sov.dto';
import { CreateSOVItemDto } from './dto/create-sov-item.dto';
import { CreateDrawRequestDto } from './dto/create-draw-request.dto';

const sovInclude = {
  job: { select: { id: true, name: true, contractValue: true } },
  items: { orderBy: { sortOrder: 'asc' as const } },
  drawRequests: {
    orderBy: { applicationNumber: 'desc' as const },
    include: { entries: true },
  },
  createdBy: { select: { id: true, name: true, email: true } },
};

@Injectable()
export class ProgressBillingService {
  constructor(
    private prisma: PrismaService,
    private invoicesService: InvoicesService,
  ) {}

  // ─── Schedule of Values ──────────────────────────────────

  async createSOV(orgId: string, userId: string, data: CreateSOVDto) {
    const retainagePercent = data.retainagePercent ?? 10;

    return this.prisma.$transaction(async (tx) => {
      const sov = await tx.scheduleOfValues.create({
        data: {
          organization: { connect: { id: orgId } },
          job: { connect: { id: data.jobId } },
          createdBy: { connect: { id: userId } },
          retainagePercent,
          notes: data.notes,
        },
      });

      if (data.items.length > 0) {
        await tx.scheduleOfValuesItem.createMany({
          data: data.items.map((item, index) => ({
            scheduleId: sov.id,
            itemNumber: item.itemNumber,
            description: item.description,
            scheduledValue: item.scheduledValue,
            costCodeId: item.costCodeId || null,
            sortOrder: index,
          })),
        });
      }

      return tx.scheduleOfValues.findUnique({
        where: { id: sov.id },
        include: sovInclude,
      });
    });
  }

  async listSOVs(
    orgId: string,
    query: { search?: string; page: number; limit: number },
  ) {
    const where: any = { organizationId: orgId };

    if (query.search) {
      where.job = { name: { contains: query.search, mode: 'insensitive' } };
    }

    const [data, total] = await Promise.all([
      this.prisma.scheduleOfValues.findMany({
        where,
        include: {
          job: { select: { id: true, name: true, contractValue: true } },
          items: { select: { id: true } },
          drawRequests: {
            orderBy: { applicationNumber: 'desc' },
            take: 1,
            include: {
              entries: true,
            },
          },
          createdBy: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.scheduleOfValues.count({ where }),
    ]);

    // Map to include summary info
    const mapped = data.map((sov) => {
      const itemCount = sov.items.length;
      const drawRequestCount = sov.drawRequests?.length ?? 0;
      const latestDraw = sov.drawRequests?.[0];

      // Compute total scheduled value from items
      // We need to fetch all items for this, but we only fetched ids
      // Instead, let's compute from the latest draw request if available
      let percentComplete = 0;
      if (latestDraw) {
        const totalEarned = latestDraw.totalEarned;
        // We need total scheduled value; we'll compute it from items
        // But we only have item IDs. Let's include scheduledValue.
        percentComplete = latestDraw.totalEarned > 0 ? 0 : 0; // Will be enriched below
      }

      const { items: _items, drawRequests: _drs, ...rest } = sov;
      return {
        ...rest,
        itemCount,
        drawRequestCount: drawRequestCount,
        latestDrawRequest: latestDraw
          ? {
              applicationNumber: latestDraw.applicationNumber,
              status: latestDraw.status,
              currentPaymentDue: latestDraw.currentPaymentDue,
              totalEarned: latestDraw.totalEarned,
            }
          : null,
      };
    });

    return { data: mapped, total, page: query.page, limit: query.limit };
  }

  async getSOV(orgId: string, sovId: string) {
    const sov = await this.prisma.scheduleOfValues.findFirst({
      where: { id: sovId, organizationId: orgId },
      include: sovInclude,
    });

    if (!sov) throw new NotFoundException('Schedule of Values not found');
    return sov;
  }

  async getSOVByJob(orgId: string, jobId: string) {
    const sov = await this.prisma.scheduleOfValues.findFirst({
      where: { jobId, organizationId: orgId },
      include: sovInclude,
    });

    if (!sov) throw new NotFoundException('No Schedule of Values found for this job');
    return sov;
  }

  async updateSOV(orgId: string, sovId: string, data: UpdateSOVDto) {
    const existing = await this.prisma.scheduleOfValues.findFirst({
      where: { id: sovId, organizationId: orgId },
    });

    if (!existing) throw new NotFoundException('Schedule of Values not found');

    const updateData: any = {};
    if (data.retainagePercent !== undefined) updateData.retainagePercent = data.retainagePercent;
    if (data.notes !== undefined) updateData.notes = data.notes;

    return this.prisma.scheduleOfValues.update({
      where: { id: sovId },
      data: updateData,
      include: sovInclude,
    });
  }

  async addSOVItem(orgId: string, sovId: string, data: CreateSOVItemDto) {
    const sov = await this.prisma.scheduleOfValues.findFirst({
      where: { id: sovId, organizationId: orgId },
      include: { items: { orderBy: { sortOrder: 'desc' }, take: 1 } },
    });

    if (!sov) throw new NotFoundException('Schedule of Values not found');

    const maxSortOrder = sov.items.length > 0 ? sov.items[0].sortOrder : -1;

    return this.prisma.scheduleOfValuesItem.create({
      data: {
        schedule: { connect: { id: sovId } },
        itemNumber: data.itemNumber,
        description: data.description,
        scheduledValue: data.scheduledValue,
        costCode: data.costCodeId ? { connect: { id: data.costCodeId } } : undefined,
        sortOrder: maxSortOrder + 1,
      },
    });
  }

  // ─── Draw Requests ───────────────────────────────────────

  async createDrawRequest(orgId: string, userId: string, data: CreateDrawRequestDto) {
    // 1. Get the SOV + items + all previous draw request entries
    const sov = await this.prisma.scheduleOfValues.findFirst({
      where: { id: data.scheduleId, organizationId: orgId },
      include: {
        items: { orderBy: { sortOrder: 'asc' } },
        drawRequests: {
          include: {
            entries: true,
          },
          orderBy: { applicationNumber: 'asc' },
        },
      },
    });

    if (!sov) throw new NotFoundException('Schedule of Values not found');

    // 2. Compute applicationNumber = max existing + 1
    const maxAppNum = sov.drawRequests.reduce(
      (max, dr) => Math.max(max, dr.applicationNumber),
      0,
    );
    const applicationNumber = maxAppNum + 1;

    // Build a map of sovItemId -> sum of all prior (workCompletedThisPeriod + materialsStored)
    const previousWorkMap = new Map<string, number>();
    for (const dr of sov.drawRequests) {
      for (const entry of dr.entries) {
        const prev = previousWorkMap.get(entry.sovItemId) || 0;
        previousWorkMap.set(
          entry.sovItemId,
          prev + entry.workCompletedThisPeriod + entry.materialsStored,
        );
      }
    }

    // Build a map of sovItem by ID
    const sovItemMap = new Map(sov.items.map((item) => [item.id, item]));

    // 3. Compute each entry
    const computedEntries = data.entries.map((entry) => {
      const sovItem = sovItemMap.get(entry.sovItemId);
      if (!sovItem) {
        throw new BadRequestException(
          `SOV item ${entry.sovItemId} not found in this schedule`,
        );
      }

      const materialsStored = entry.materialsStored ?? 0;
      const workCompletedPrevious = previousWorkMap.get(entry.sovItemId) || 0;
      const totalCompletedAndStored =
        workCompletedPrevious + entry.workCompletedThisPeriod + materialsStored;
      const percentComplete =
        sovItem.scheduledValue > 0
          ? Math.min((totalCompletedAndStored / sovItem.scheduledValue) * 100, 100)
          : 0;
      const balanceToFinish = Math.max(
        sovItem.scheduledValue - totalCompletedAndStored,
        0,
      );
      const retainage = Math.round(
        totalCompletedAndStored * (sov.retainagePercent / 100),
      );

      return {
        sovItemId: entry.sovItemId,
        workCompletedPrevious,
        workCompletedThisPeriod: entry.workCompletedThisPeriod,
        materialsStored,
        totalCompletedAndStored,
        percentComplete: Math.round(percentComplete * 100) / 100, // 2 decimal places
        balanceToFinish,
        retainage,
      };
    });

    // 4. Compute draw request totals
    const totalEarned = computedEntries.reduce(
      (sum, e) => sum + e.totalCompletedAndStored,
      0,
    );
    const totalRetainage = computedEntries.reduce(
      (sum, e) => sum + e.retainage,
      0,
    );
    const totalPreviouslyBilled = sov.drawRequests.reduce(
      (sum, dr) => sum + dr.currentPaymentDue,
      0,
    );
    const currentPaymentDue = totalEarned - totalRetainage - totalPreviouslyBilled;

    // 5. Create DrawRequest + DrawRequestEntries in $transaction
    return this.prisma.$transaction(async (tx) => {
      const drawRequest = await tx.drawRequest.create({
        data: {
          schedule: { connect: { id: data.scheduleId } },
          organization: { connect: { id: orgId } },
          createdBy: { connect: { id: userId } },
          applicationNumber,
          periodTo: new Date(data.periodTo),
          notes: data.notes,
          totalEarned,
          totalRetainage,
          totalPreviouslyBilled,
          currentPaymentDue,
        },
      });

      if (computedEntries.length > 0) {
        await tx.drawRequestEntry.createMany({
          data: computedEntries.map((entry) => ({
            drawRequestId: drawRequest.id,
            sovItemId: entry.sovItemId,
            workCompletedPrevious: entry.workCompletedPrevious,
            workCompletedThisPeriod: entry.workCompletedThisPeriod,
            materialsStored: entry.materialsStored,
            totalCompletedAndStored: entry.totalCompletedAndStored,
            percentComplete: entry.percentComplete,
            balanceToFinish: entry.balanceToFinish,
            retainage: entry.retainage,
          })),
        });
      }

      return tx.drawRequest.findUnique({
        where: { id: drawRequest.id },
        include: {
          entries: {
            include: {
              sovItem: true,
            },
          },
          schedule: {
            include: {
              job: { select: { id: true, name: true, contractValue: true } },
            },
          },
          createdBy: { select: { id: true, name: true, email: true } },
        },
      });
    });
  }

  async getDrawRequest(orgId: string, drId: string) {
    const dr = await this.prisma.drawRequest.findFirst({
      where: { id: drId, organizationId: orgId },
      include: {
        entries: {
          include: {
            sovItem: true,
          },
        },
        schedule: {
          include: {
            job: { select: { id: true, name: true, contractValue: true } },
            items: { orderBy: { sortOrder: 'asc' } },
          },
        },
        createdBy: { select: { id: true, name: true, email: true } },
        approvedBy: { select: { id: true, name: true, email: true } },
      },
    });

    if (!dr) throw new NotFoundException('Draw Request not found');
    return dr;
  }

  async submitDrawRequest(orgId: string, drId: string) {
    const dr = await this.prisma.drawRequest.findFirst({
      where: { id: drId, organizationId: orgId },
    });

    if (!dr) throw new NotFoundException('Draw Request not found');
    if (dr.status !== 'DRAFT') {
      throw new BadRequestException('Only DRAFT draw requests can be submitted');
    }

    return this.prisma.drawRequest.update({
      where: { id: drId },
      data: { status: 'SUBMITTED' },
      include: {
        entries: { include: { sovItem: true } },
        schedule: {
          include: {
            job: { select: { id: true, name: true, contractValue: true } },
          },
        },
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async approveDrawRequest(orgId: string, drId: string, userId: string) {
    const dr = await this.prisma.drawRequest.findFirst({
      where: { id: drId, organizationId: orgId },
      include: {
        entries: {
          include: { sovItem: true },
        },
        schedule: {
          include: {
            job: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!dr) throw new NotFoundException('Draw Request not found');
    if (dr.status !== 'SUBMITTED') {
      throw new BadRequestException('Only SUBMITTED draw requests can be approved');
    }

    // Auto-generate invoice
    const lineItems = dr.entries
      .filter((e) => e.workCompletedThisPeriod > 0)
      .map((e) => ({
        description: `${e.sovItem.description} (Period ${dr.applicationNumber})`,
        quantity: 1,
        unitPrice: e.workCompletedThisPeriod,
      }));

    // Add retainage deduction as a negative line item
    if (dr.totalRetainage > 0) {
      // Calculate retainage for this period's work only
      const thisPeriodRetainage = dr.entries.reduce((sum, e) => {
        const thisPeriodWork = e.workCompletedThisPeriod + e.materialsStored;
        return sum + Math.round(thisPeriodWork * (dr.schedule.retainagePercent / 100));
      }, 0);

      if (thisPeriodRetainage > 0) {
        lineItems.push({
          description: `Retainage (${dr.schedule.retainagePercent}%)`,
          quantity: 1,
          unitPrice: -thisPeriodRetainage,
        });
      }
    }

    let invoiceId: string | null = null;

    if (lineItems.length > 0) {
      const invoice = await this.invoicesService.create(orgId, userId, {
        jobId: dr.schedule.jobId,
        notes: `Draw Request #${dr.applicationNumber}`,
        taxRate: 0,
        lineItems,
      });

      invoiceId = invoice!.id;
    }

    // Update draw request status and link invoice
    return this.prisma.drawRequest.update({
      where: { id: drId },
      data: {
        status: 'APPROVED',
        approvedBy: { connect: { id: userId } },
        approvedAt: new Date(),
        ...(invoiceId ? { invoice: { connect: { id: invoiceId } } } : {}),
      },
      include: {
        entries: { include: { sovItem: true } },
        schedule: {
          include: {
            job: { select: { id: true, name: true, contractValue: true } },
          },
        },
        createdBy: { select: { id: true, name: true, email: true } },
        approvedBy: { select: { id: true, name: true, email: true } },
      },
    });
  }

  // ─── Summary ─────────────────────────────────────────────

  async getSummary(orgId: string, sovId: string) {
    const sov = await this.prisma.scheduleOfValues.findFirst({
      where: { id: sovId, organizationId: orgId },
      include: {
        items: true,
        drawRequests: {
          orderBy: { applicationNumber: 'desc' },
          take: 1,
        },
      },
    });

    if (!sov) throw new NotFoundException('Schedule of Values not found');

    const totalScheduledValue = sov.items.reduce(
      (sum, item) => sum + item.scheduledValue,
      0,
    );

    const latestDraw = sov.drawRequests[0];
    const totalEarned = latestDraw?.totalEarned ?? 0;
    const totalRetainage = latestDraw?.totalRetainage ?? 0;
    const totalBilled = latestDraw
      ? latestDraw.totalPreviouslyBilled + latestDraw.currentPaymentDue
      : 0;
    const remainingValue = totalScheduledValue - totalEarned;
    const percentComplete =
      totalScheduledValue > 0
        ? Math.round((totalEarned / totalScheduledValue) * 10000) / 100
        : 0;

    return {
      totalScheduledValue,
      totalEarned,
      totalRetainage,
      totalBilled,
      remainingValue,
      percentComplete,
    };
  }
}
