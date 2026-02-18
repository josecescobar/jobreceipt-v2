import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { S3Service } from '../../common/services/s3.service';
import { Prisma } from '@prisma/client';
import { v4 as uuid } from 'uuid';

interface CreateJobData {
  name: string;
  customerName?: string | null;
  customerAddress?: string | null;
  customerLat?: number | null;
  customerLng?: number | null;
  budgetTotal?: number | null;
  budgetMaterials?: number | null;
  budgetLabor?: number | null;
  startDate?: string | null;
  endDate?: string | null;
  notes?: string | null;
}

interface JobQuery {
  status?: 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
  search?: string;
  page: number;
  limit: number;
}

@Injectable()
export class JobsService {
  constructor(
    private prisma: PrismaService,
    private s3Service: S3Service,
  ) {}

  async create(orgId: string, data: CreateJobData) {
    return this.prisma.job.create({
      data: {
        organizationId: orgId,
        name: data.name,
        customerName: data.customerName,
        customerAddress: data.customerAddress,
        customerLat: data.customerLat,
        customerLng: data.customerLng,
        budgetTotal: data.budgetTotal,
        budgetMaterials: data.budgetMaterials,
        budgetLabor: data.budgetLabor,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        notes: data.notes,
      },
    });
  }

  async findAll(orgId: string, query: JobQuery) {
    const where: Prisma.JobWhereInput = { organizationId: orgId };

    if (query.status) {
      where.status = query.status;
    }

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { customerName: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [jobs, total] = await Promise.all([
      this.prisma.job.findMany({
        where,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.job.count({ where }),
    ]);

    return { data: jobs, total, page: query.page, limit: query.limit };
  }

  async findOne(orgId: string, id: string) {
    const job = await this.prisma.job.findFirst({
      where: { id, organizationId: orgId },
      include: {
        _count: { select: { expenses: true, lineItems: true } },
      },
    });
    if (!job) throw new NotFoundException('Job not found');
    return job;
  }

  async update(orgId: string, id: string, data: Partial<CreateJobData> & { status?: 'ACTIVE' | 'COMPLETED' | 'ARCHIVED' }) {
    await this.findOne(orgId, id);

    const updateData: Prisma.JobUpdateInput = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.customerName !== undefined) updateData.customerName = data.customerName;
    if (data.customerAddress !== undefined) updateData.customerAddress = data.customerAddress;
    if (data.customerLat !== undefined) updateData.customerLat = data.customerLat;
    if (data.customerLng !== undefined) updateData.customerLng = data.customerLng;
    if (data.budgetTotal !== undefined) updateData.budgetTotal = data.budgetTotal;
    if (data.budgetMaterials !== undefined) updateData.budgetMaterials = data.budgetMaterials;
    if (data.budgetLabor !== undefined) updateData.budgetLabor = data.budgetLabor;
    if (data.startDate !== undefined) updateData.startDate = data.startDate ? new Date(data.startDate) : null;
    if (data.endDate !== undefined) updateData.endDate = data.endDate ? new Date(data.endDate) : null;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.status !== undefined) updateData.status = data.status;

    return this.prisma.job.update({
      where: { id },
      data: updateData,
    });
  }

  async archive(orgId: string, id: string) {
    await this.findOne(orgId, id);
    return this.prisma.job.update({
      where: { id },
      data: { status: 'ARCHIVED' },
    });
  }

  async getBudget(orgId: string, jobId: string) {
    const job = await this.findOne(orgId, jobId);

    // Aggregate expenses by cost code category
    const expenses = await this.prisma.expense.findMany({
      where: { organizationId: orgId, jobId },
      include: { costCode: true },
    });

    let materialsSpent = 0;
    let laborSpent = 0;
    let equipmentSpent = 0;
    let subcontractorSpent = 0;
    let overheadSpent = 0;

    for (const expense of expenses) {
      const category = expense.costCode?.category;
      switch (category) {
        case 'MATERIALS':
          materialsSpent += expense.amount;
          break;
        case 'LABOR':
          laborSpent += expense.amount;
          break;
        case 'EQUIPMENT':
          equipmentSpent += expense.amount;
          break;
        case 'SUBCONTRACTOR':
          subcontractorSpent += expense.amount;
          break;
        case 'OVERHEAD':
          overheadSpent += expense.amount;
          break;
        default:
          // Expenses without a cost code count as materials by default
          materialsSpent += expense.amount;
      }
    }

    const totalSpent = materialsSpent + laborSpent + equipmentSpent + subcontractorSpent + overheadSpent;

    return {
      jobId,
      jobName: job.name,
      totalBudget: job.budgetTotal || 0,
      totalSpent,
      totalRemaining: (job.budgetTotal || 0) - totalSpent,
      materialsBudget: job.budgetMaterials || 0,
      materialsSpent,
      materialsRemaining: (job.budgetMaterials || 0) - materialsSpent,
      laborBudget: job.budgetLabor || 0,
      laborSpent,
      laborRemaining: (job.budgetLabor || 0) - laborSpent,
      byCategory: {
        MATERIALS: { budget: job.budgetMaterials || 0, spent: materialsSpent },
        LABOR: { budget: job.budgetLabor || 0, spent: laborSpent },
        EQUIPMENT: { budget: 0, spent: equipmentSpent },
        SUBCONTRACTOR: { budget: 0, spent: subcontractorSpent },
        OVERHEAD: { budget: 0, spent: overheadSpent },
      },
    };
  }

  async requestPhotoUploadUrl(orgId: string, jobId: string) {
    await this.findOne(orgId, jobId);
    const id = uuid();
    const key = `job-photos/${orgId}/${jobId}/${id}.jpg`;
    const { url } = await this.s3Service.generateUploadUrl(key, 'image/jpeg');
    return { uploadUrl: url, imageKey: key };
  }

  async createPhoto(orgId: string, jobId: string, userId: string, imageKey: string, caption?: string) {
    await this.findOne(orgId, jobId);
    return this.prisma.jobPhoto.create({
      data: {
        jobId,
        organizationId: orgId,
        imageKey,
        caption: caption || null,
        uploadedById: userId,
      },
    });
  }

  async getPhotos(orgId: string, jobId: string) {
    const photos = await this.prisma.jobPhoto.findMany({
      where: { jobId, organizationId: orgId },
      orderBy: { createdAt: 'desc' },
    });

    const photosWithUrls = await Promise.all(
      photos.map(async (photo) => ({
        ...photo,
        imageUrl: await this.s3Service.generateDownloadUrl(photo.imageKey),
      })),
    );

    return photosWithUrls;
  }

  async deletePhoto(orgId: string, jobId: string, photoId: string) {
    const photo = await this.prisma.jobPhoto.findFirst({
      where: { id: photoId, jobId, organizationId: orgId },
    });
    if (!photo) throw new NotFoundException('Photo not found');

    await this.s3Service.deleteObject(photo.imageKey);
    await this.prisma.jobPhoto.delete({ where: { id: photoId } });
  }
}
