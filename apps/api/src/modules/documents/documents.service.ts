import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { S3Service } from '../../common/services/s3.service';
import { Prisma } from '@prisma/client';
import { v4 as uuid } from 'uuid';

interface CreateDocumentData {
  name: string;
  type?: string;
  fileKey: string;
  fileType: string;
  fileSize: number;
  jobId?: string;
  vendorId?: string;
  subcontractorId?: string;
  expiresAt?: string;
  notes?: string;
}

interface UpdateDocumentData {
  name?: string;
  type?: string;
  notes?: string;
  expiresAt?: string;
}

interface DocumentQuery {
  type?: string;
  jobId?: string;
  vendorId?: string;
  subcontractorId?: string;
  search?: string;
  page: number;
  limit: number;
}

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);

  constructor(
    private prisma: PrismaService,
    private s3Service: S3Service,
  ) {}

  async generateUploadUrl(orgId: string, fileName: string, contentType: string) {
    const id = uuid();
    const key = `documents/${orgId}/${id}/${fileName}`;
    const { url } = await this.s3Service.generateUploadUrl(key, contentType);
    return { uploadUrl: url, fileKey: key };
  }

  async create(orgId: string, userId: string, data: CreateDocumentData) {
    return this.prisma.document.create({
      data: {
        organizationId: orgId,
        uploadedById: userId,
        name: data.name,
        type: (data.type as any) || undefined,
        fileKey: data.fileKey,
        fileType: data.fileType,
        fileSize: data.fileSize,
        jobId: data.jobId || null,
        vendorId: data.vendorId || null,
        subcontractorId: data.subcontractorId || null,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        notes: data.notes || null,
      },
    });
  }

  async findAll(orgId: string, query: DocumentQuery) {
    const where: Prisma.DocumentWhereInput = { organizationId: orgId };

    if (query.type) where.type = query.type as any;
    if (query.jobId) where.jobId = query.jobId;
    if (query.vendorId) where.vendorId = query.vendorId;
    if (query.subcontractorId) where.subcontractorId = query.subcontractorId;

    if (query.search) {
      where.name = { contains: query.search, mode: 'insensitive' };
    }

    const [documents, total] = await Promise.all([
      this.prisma.document.findMany({
        where,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
        include: {
          job: { select: { id: true, name: true } },
          vendor: { select: { id: true, name: true } },
          subcontractor: { select: { id: true, name: true } },
          uploadedBy: { select: { id: true, name: true } },
        },
      }),
      this.prisma.document.count({ where }),
    ]);

    // Generate download URLs for each document
    const documentsWithUrls = await Promise.all(
      documents.map(async (doc) => {
        const downloadUrl = await this.s3Service.generateDownloadUrl(doc.fileKey);
        return { ...doc, downloadUrl };
      }),
    );

    return {
      data: documentsWithUrls,
      total,
      page: query.page,
      limit: query.limit,
    };
  }

  async findOne(orgId: string, id: string) {
    const document = await this.prisma.document.findFirst({
      where: { id, organizationId: orgId },
      include: {
        job: { select: { id: true, name: true } },
        vendor: { select: { id: true, name: true } },
        subcontractor: { select: { id: true, name: true } },
        uploadedBy: { select: { id: true, name: true, email: true } },
      },
    });

    if (!document) throw new NotFoundException('Document not found');

    const downloadUrl = await this.s3Service.generateDownloadUrl(document.fileKey);
    return { ...document, downloadUrl };
  }

  async update(orgId: string, id: string, data: UpdateDocumentData) {
    await this.findOne(orgId, id);

    const updateData: Prisma.DocumentUpdateInput = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.type !== undefined) updateData.type = data.type as any;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.expiresAt !== undefined) {
      updateData.expiresAt = data.expiresAt ? new Date(data.expiresAt) : null;
    }

    return this.prisma.document.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(orgId: string, id: string) {
    const document = await this.findOne(orgId, id);

    // Delete from S3 first
    await this.s3Service.deleteObject(document.fileKey);
    this.logger.log(`Deleted S3 object for document ${id}: ${document.fileKey}`);

    // Then delete DB record
    return this.prisma.document.delete({ where: { id } });
  }
}
