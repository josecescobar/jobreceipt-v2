import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { S3Service } from '../../common/services/s3.service';
import { CreatePunchListItemDto } from './dto/create-punch-list-item.dto';
import { UpdatePunchListItemDto } from './dto/update-punch-list-item.dto';
import { QueryPunchListItemDto } from './dto/query-punch-list-item.dto';
import { v4 as uuid } from 'uuid';

@Injectable()
export class PunchListsService {
  constructor(
    private prisma: PrismaService,
    private s3: S3Service,
  ) {}

  async create(orgId: string, userId: string, data: CreatePunchListItemDto) {
    return this.prisma.punchListItem.create({
      data: {
        organization: { connect: { id: orgId } },
        job: { connect: { id: data.jobId } },
        createdBy: { connect: { id: userId } },
        title: data.title,
        description: data.description,
        priority: data.priority,
        ...(data.assignedToId
          ? { assignedTo: { connect: { id: data.assignedToId } } }
          : {}),
        ...(data.dueDate ? { dueDate: new Date(data.dueDate) } : {}),
      },
      include: {
        assignedTo: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
        job: { select: { id: true, name: true } },
      },
    });
  }

  async findAll(orgId: string, query: QueryPunchListItemDto) {
    const where: any = {
      organizationId: orgId,
      jobId: query.jobId,
    };

    if (query.status) where.status = query.status;
    if (query.assignedToId) where.assignedToId = query.assignedToId;
    if (query.priority) where.priority = query.priority;

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const [data, total] = await Promise.all([
      this.prisma.punchListItem.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
        include: {
          assignedTo: { select: { id: true, name: true } },
          _count: { select: { photos: true } },
        },
      }),
      this.prisma.punchListItem.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findOne(orgId: string, id: string) {
    const item = await this.prisma.punchListItem.findFirst({
      where: { id, organizationId: orgId },
      include: {
        photos: true,
        assignedTo: { select: { id: true, name: true } },
        completedBy: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
        job: { select: { id: true, name: true } },
      },
    });

    if (!item) throw new NotFoundException('Punch list item not found');

    // Generate download URLs for photos
    const photosWithUrls = await Promise.all(
      item.photos.map(async (photo) => ({
        ...photo,
        imageUrl: await this.s3.generateDownloadUrl(photo.imageKey),
      })),
    );

    return { ...item, photos: photosWithUrls };
  }

  async update(
    orgId: string,
    id: string,
    userId: string,
    data: UpdatePunchListItemDto,
  ) {
    const existing = await this.prisma.punchListItem.findFirst({
      where: { id, organizationId: orgId },
    });

    if (!existing) throw new NotFoundException('Punch list item not found');

    const updateData: any = {};

    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.dueDate !== undefined) updateData.dueDate = new Date(data.dueDate);
    if (data.assignedToId !== undefined) {
      updateData.assignedTo = data.assignedToId
        ? { connect: { id: data.assignedToId } }
        : { disconnect: true };
    }

    // Handle status transitions
    if (data.status !== undefined) {
      updateData.status = data.status;

      if (data.status === 'COMPLETED') {
        updateData.completedAt = new Date();
        updateData.completedBy = { connect: { id: userId } };
      } else if (existing.status === 'COMPLETED') {
        // Moving away from COMPLETED — clear completion data
        updateData.completedAt = null;
        updateData.completedBy = { disconnect: true };
      }
    }

    return this.prisma.punchListItem.update({
      where: { id },
      data: updateData,
      include: {
        assignedTo: { select: { id: true, name: true } },
        completedBy: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
        job: { select: { id: true, name: true } },
      },
    });
  }

  async remove(orgId: string, id: string) {
    const item = await this.prisma.punchListItem.findFirst({
      where: { id, organizationId: orgId },
      include: { photos: true },
    });

    if (!item) throw new NotFoundException('Punch list item not found');

    // Delete all photo S3 objects
    await Promise.all(
      item.photos.map((photo) => this.s3.deleteObject(photo.imageKey)),
    );

    return this.prisma.punchListItem.delete({ where: { id } });
  }

  async getJobSummary(orgId: string, jobId: string) {
    const [open, inProgress, completed] = await Promise.all([
      this.prisma.punchListItem.count({
        where: { organizationId: orgId, jobId, status: 'OPEN' },
      }),
      this.prisma.punchListItem.count({
        where: { organizationId: orgId, jobId, status: 'IN_PROGRESS' },
      }),
      this.prisma.punchListItem.count({
        where: { organizationId: orgId, jobId, status: 'COMPLETED' },
      }),
    ]);

    const total = open + inProgress + completed;
    const completionPercent = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, open, inProgress, completed, completionPercent };
  }

  async getPhotoUploadUrl(orgId: string, itemId: string) {
    const item = await this.prisma.punchListItem.findFirst({
      where: { id: itemId, organizationId: orgId },
    });
    if (!item) throw new NotFoundException('Punch list item not found');

    const key = `punch-list-photos/${orgId}/${itemId}/${uuid()}.jpg`;
    const { url } = await this.s3.generateUploadUrl(key, 'image/jpeg');

    return { uploadUrl: url, imageKey: key };
  }

  async createPhoto(
    orgId: string,
    userId: string,
    itemId: string,
    imageKey: string,
    caption?: string,
  ) {
    const item = await this.prisma.punchListItem.findFirst({
      where: { id: itemId, organizationId: orgId },
    });
    if (!item) throw new NotFoundException('Punch list item not found');

    const photo = await this.prisma.punchListPhoto.create({
      data: {
        punchListItemId: itemId,
        imageKey,
        caption,
        uploadedById: userId,
      },
    });

    const imageUrl = await this.s3.generateDownloadUrl(photo.imageKey);
    return { ...photo, imageUrl };
  }

  async deletePhoto(orgId: string, itemId: string, photoId: string) {
    const item = await this.prisma.punchListItem.findFirst({
      where: { id: itemId, organizationId: orgId },
    });
    if (!item) throw new NotFoundException('Punch list item not found');

    const photo = await this.prisma.punchListPhoto.findFirst({
      where: { id: photoId, punchListItemId: itemId },
    });
    if (!photo) throw new NotFoundException('Photo not found');

    await this.s3.deleteObject(photo.imageKey);
    return this.prisma.punchListPhoto.delete({ where: { id: photoId } });
  }
}
