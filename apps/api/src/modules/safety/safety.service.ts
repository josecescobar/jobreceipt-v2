import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { S3Service } from '../../common/services/s3.service';
import { CreateSafetyInspectionDto } from './dto/create-safety-inspection.dto';
import { UpdateSafetyInspectionDto } from './dto/update-safety-inspection.dto';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { UpdateIncidentDto } from './dto/update-incident.dto';
import { v4 as uuid } from 'uuid';

@Injectable()
export class SafetyService {
  constructor(
    private prisma: PrismaService,
    private s3: S3Service,
  ) {}

  private readonly SAFETY_TEMPLATES: { name: string; items: string[] }[] = [
    {
      name: 'Fall Protection',
      items: [
        'Guardrails in place',
        'Safety nets inspected',
        'Harness equipment checked',
        'Anchor points verified',
        'Warning lines intact',
      ],
    },
    {
      name: 'PPE Compliance',
      items: [
        'Hard hats worn',
        'Safety glasses on',
        'Steel-toe boots',
        'High-visibility vests',
        'Gloves available',
        'Hearing protection',
      ],
    },
    {
      name: 'Scaffolding Safety',
      items: [
        'Base plates secure',
        'Cross bracing intact',
        'Planking complete',
        'Guard rails installed',
        'Access ladders safe',
        'Load limits posted',
      ],
    },
    {
      name: 'Electrical Safety',
      items: [
        'GFCI protection active',
        'Cords undamaged',
        'Lockout/tagout verified',
        'Panel clearance maintained',
        'Grounding verified',
      ],
    },
    {
      name: 'Confined Space',
      items: [
        'Atmospheric testing done',
        'Ventilation adequate',
        'Entry permit posted',
        'Rescue equipment ready',
        'Communication system tested',
      ],
    },
    {
      name: 'Fire Prevention',
      items: [
        'Extinguishers accessible',
        'Hot work permit posted',
        'Flammable storage proper',
        'Exit routes clear',
        'No smoking enforced',
      ],
    },
  ];

  getTemplates() {
    return this.SAFETY_TEMPLATES;
  }

  async createInspection(
    orgId: string,
    userId: string,
    data: CreateSafetyInspectionDto,
  ) {
    const template = this.SAFETY_TEMPLATES.find(
      (t) => t.name === data.templateName,
    );
    if (!template) {
      throw new NotFoundException(
        `Template "${data.templateName}" not found`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const inspection = await tx.safetyInspection.create({
        data: {
          organizationId: orgId,
          jobId: data.jobId,
          templateName: data.templateName,
          createdById: userId,
          items: {
            create: template.items.map((label, index) => ({
              label,
              isCompliant: false,
              sortOrder: index,
            })),
          },
        },
        include: {
          items: { orderBy: { sortOrder: 'asc' } },
          job: { select: { id: true, name: true } },
          createdBy: { select: { id: true, name: true, email: true } },
        },
      });

      return inspection;
    });
  }

  async findAllInspections(
    orgId: string,
    query: {
      jobId?: string;
      status?: string;
      page?: number;
      limit?: number;
    },
  ) {
    const where: any = { organizationId: orgId };

    if (query.jobId) where.jobId = query.jobId;
    if (query.status) where.status = query.status;

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const [data, total] = await Promise.all([
      this.prisma.safetyInspection.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          items: { orderBy: { sortOrder: 'asc' } },
          job: { select: { id: true, name: true } },
          createdBy: { select: { id: true, name: true, email: true } },
        },
      }),
      this.prisma.safetyInspection.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findOneInspection(orgId: string, id: string) {
    const inspection = await this.prisma.safetyInspection.findFirst({
      where: { id, organizationId: orgId },
      include: {
        items: { orderBy: { sortOrder: 'asc' } },
        job: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true, email: true } },
        completedBy: { select: { id: true, name: true, email: true } },
      },
    });

    if (!inspection) {
      throw new NotFoundException('Safety inspection not found');
    }

    return inspection;
  }

  async updateInspection(
    orgId: string,
    id: string,
    userId: string,
    data: UpdateSafetyInspectionDto,
  ) {
    const existing = await this.prisma.safetyInspection.findFirst({
      where: { id, organizationId: orgId },
    });

    if (!existing) {
      throw new NotFoundException('Safety inspection not found');
    }

    return this.prisma.$transaction(async (tx) => {
      // Update individual items if provided
      if (data.items && data.items.length > 0) {
        for (const item of data.items) {
          await tx.safetyInspectionItem.update({
            where: { id: item.id },
            data: {
              isCompliant: item.isCompliant,
              ...(item.notes !== undefined ? { notes: item.notes } : {}),
            },
          });
        }
      }

      // Build inspection update data
      const updateData: any = {};
      if (data.notes !== undefined) updateData.notes = data.notes;

      if (data.status !== undefined) {
        updateData.status = data.status;
        if (data.status === 'COMPLETE') {
          updateData.completedById = userId;
          updateData.completedAt = new Date();
        } else if (existing.status === 'COMPLETE') {
          updateData.completedById = null;
          updateData.completedAt = null;
        }
      }

      const inspection = await tx.safetyInspection.update({
        where: { id },
        data: updateData,
        include: {
          items: { orderBy: { sortOrder: 'asc' } },
          job: { select: { id: true, name: true } },
          createdBy: { select: { id: true, name: true, email: true } },
          completedBy: { select: { id: true, name: true, email: true } },
        },
      });

      return inspection;
    });
  }

  async createIncident(
    orgId: string,
    userId: string,
    data: CreateIncidentDto,
  ) {
    return this.prisma.safetyIncident.create({
      data: {
        organizationId: orgId,
        jobId: data.jobId,
        reportedById: userId,
        incidentDate: new Date(data.incidentDate),
        type: data.type,
        severity: data.severity,
        title: data.title,
        description: data.description,
        location: data.location,
        witnesses: data.witnesses,
        actionTaken: data.actionTaken,
        followUp: data.followUp,
        createdById: userId,
      },
      include: {
        job: { select: { id: true, name: true } },
        reportedBy: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async findAllIncidents(
    orgId: string,
    query: {
      jobId?: string;
      status?: string;
      type?: string;
      severity?: string;
      page?: number;
      limit?: number;
    },
  ) {
    const where: any = { organizationId: orgId };

    if (query.jobId) where.jobId = query.jobId;
    if (query.status) where.status = query.status;
    if (query.type) where.type = query.type;
    if (query.severity) where.severity = query.severity;

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const [data, total] = await Promise.all([
      this.prisma.safetyIncident.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          job: { select: { id: true, name: true } },
          reportedBy: { select: { id: true, name: true, email: true } },
          _count: { select: { photos: true } },
        },
      }),
      this.prisma.safetyIncident.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findOneIncident(orgId: string, id: string) {
    const incident = await this.prisma.safetyIncident.findFirst({
      where: { id, organizationId: orgId },
      include: {
        photos: true,
        job: { select: { id: true, name: true } },
        reportedBy: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });

    if (!incident) {
      throw new NotFoundException('Safety incident not found');
    }

    // Generate signed URLs for photos
    const photosWithUrls = await Promise.all(
      incident.photos.map(async (photo) => ({
        ...photo,
        url: await this.s3.generateDownloadUrl(photo.imageKey),
      })),
    );

    return { ...incident, photos: photosWithUrls };
  }

  async updateIncident(orgId: string, id: string, data: UpdateIncidentDto) {
    const existing = await this.prisma.safetyIncident.findFirst({
      where: { id, organizationId: orgId },
    });

    if (!existing) {
      throw new NotFoundException('Safety incident not found');
    }

    const updateData: any = {};

    if (data.type !== undefined) updateData.type = data.type;
    if (data.severity !== undefined) updateData.severity = data.severity;
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined)
      updateData.description = data.description;
    if (data.location !== undefined) updateData.location = data.location;
    if (data.witnesses !== undefined) updateData.witnesses = data.witnesses;
    if (data.actionTaken !== undefined)
      updateData.actionTaken = data.actionTaken;
    if (data.followUp !== undefined) updateData.followUp = data.followUp;

    if (data.status !== undefined) {
      updateData.status = data.status;
      if (
        (data.status === 'RESOLVED' || data.status === 'CLOSED') &&
        !existing.resolvedAt
      ) {
        updateData.resolvedAt = new Date();
      }
    }

    if (data.resolvedAt !== undefined) {
      updateData.resolvedAt = data.resolvedAt
        ? new Date(data.resolvedAt)
        : null;
    }

    return this.prisma.safetyIncident.update({
      where: { id },
      data: updateData,
      include: {
        job: { select: { id: true, name: true } },
        reportedBy: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async getPhotoUploadUrl(orgId: string, incidentId: string) {
    const incident = await this.prisma.safetyIncident.findFirst({
      where: { id: incidentId, organizationId: orgId },
    });
    if (!incident) throw new NotFoundException('Safety incident not found');

    const key = `safety-incident-photos/${orgId}/${incidentId}/${uuid()}.jpg`;
    const { url } = await this.s3.generateUploadUrl(key, 'image/jpeg');

    return { uploadUrl: url, imageKey: key };
  }

  async createIncidentPhoto(
    orgId: string,
    incidentId: string,
    userId: string,
    imageKey: string,
    caption?: string,
  ) {
    const incident = await this.prisma.safetyIncident.findFirst({
      where: { id: incidentId, organizationId: orgId },
    });
    if (!incident) throw new NotFoundException('Safety incident not found');

    const photo = await this.prisma.safetyIncidentPhoto.create({
      data: {
        incidentId,
        imageKey,
        caption,
        uploadedById: userId,
      },
    });

    const url = await this.s3.generateDownloadUrl(photo.imageKey);
    return { ...photo, url };
  }

  async getSummary(orgId: string) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [openIncidents, inspectionsThisMonth, totalInspections, totalIncidents] =
      await Promise.all([
        this.prisma.safetyIncident.count({
          where: {
            organizationId: orgId,
            status: { in: ['OPEN', 'INVESTIGATING'] },
          },
        }),
        this.prisma.safetyInspection.count({
          where: {
            organizationId: orgId,
            createdAt: { gte: startOfMonth },
          },
        }),
        this.prisma.safetyInspection.count({
          where: { organizationId: orgId },
        }),
        this.prisma.safetyIncident.count({
          where: { organizationId: orgId },
        }),
      ]);

    return {
      openIncidents,
      inspectionsThisMonth,
      totalInspections,
      totalIncidents,
    };
  }
}
