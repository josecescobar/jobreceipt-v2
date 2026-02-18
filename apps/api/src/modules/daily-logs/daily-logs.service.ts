import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { S3Service } from '../../common/services/s3.service';
import { CreateDailyLogDto } from './dto/create-daily-log.dto';
import { UpdateDailyLogDto } from './dto/update-daily-log.dto';
import { v4 as uuid } from 'uuid';

interface DailyLogQuery {
  jobId: string;
  startDate?: string;
  endDate?: string;
  page: number;
  limit: number;
}

@Injectable()
export class DailyLogsService {
  constructor(
    private prisma: PrismaService,
    private s3: S3Service,
  ) {}

  async findAll(orgId: string, query: DailyLogQuery) {
    const where: any = {
      organizationId: orgId,
      jobId: query.jobId,
    };

    if (query.startDate || query.endDate) {
      where.date = {};
      if (query.startDate) where.date.gte = new Date(query.startDate);
      if (query.endDate) where.date.lte = new Date(query.endDate);
    }

    const [data, total] = await Promise.all([
      this.prisma.dailyLog.findMany({
        where,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: { date: 'desc' },
        include: {
          user: { select: { id: true, name: true } },
          _count: { select: { photos: true } },
        },
      }),
      this.prisma.dailyLog.count({ where }),
    ]);

    return { data, total, page: query.page, limit: query.limit };
  }

  async findOne(orgId: string, id: string) {
    const log = await this.prisma.dailyLog.findFirst({
      where: { id, organizationId: orgId },
      include: {
        photos: true,
        user: { select: { id: true, name: true } },
        job: { select: { id: true, name: true } },
      },
    });

    if (!log) throw new NotFoundException('Daily log not found');

    // Generate download URLs for photos
    const photosWithUrls = await Promise.all(
      log.photos.map(async (photo) => ({
        ...photo,
        imageUrl: await this.s3.generateDownloadUrl(photo.imageKey),
      })),
    );

    return { ...log, photos: photosWithUrls };
  }

  async create(orgId: string, userId: string, data: CreateDailyLogDto) {
    try {
      return await this.prisma.dailyLog.create({
        data: {
          organizationId: orgId,
          userId,
          jobId: data.jobId,
          date: new Date(data.date),
          weather: data.weather,
          temperature: data.temperature,
          crewCount: data.crewCount,
          workPerformed: data.workPerformed,
          materialsUsed: data.materialsUsed,
          safetyNotes: data.safetyNotes,
          hoursWorked: data.hoursWorked,
          notes: data.notes,
        },
        include: {
          user: { select: { id: true, name: true } },
          job: { select: { id: true, name: true } },
        },
      });
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new ConflictException(
          'Log already exists for this job/user/date',
        );
      }
      throw error;
    }
  }

  async update(orgId: string, id: string, data: UpdateDailyLogDto) {
    await this.findOne(orgId, id);

    const updateData: any = {};
    if (data.weather !== undefined) updateData.weather = data.weather;
    if (data.temperature !== undefined) updateData.temperature = data.temperature;
    if (data.crewCount !== undefined) updateData.crewCount = data.crewCount;
    if (data.workPerformed !== undefined) updateData.workPerformed = data.workPerformed;
    if (data.materialsUsed !== undefined) updateData.materialsUsed = data.materialsUsed;
    if (data.safetyNotes !== undefined) updateData.safetyNotes = data.safetyNotes;
    if (data.hoursWorked !== undefined) updateData.hoursWorked = data.hoursWorked;
    if (data.notes !== undefined) updateData.notes = data.notes;

    return this.prisma.dailyLog.update({
      where: { id },
      data: updateData,
      include: {
        user: { select: { id: true, name: true } },
        job: { select: { id: true, name: true } },
      },
    });
  }

  async remove(orgId: string, id: string) {
    const log = await this.prisma.dailyLog.findFirst({
      where: { id, organizationId: orgId },
      include: { photos: true },
    });

    if (!log) throw new NotFoundException('Daily log not found');

    // Delete all photo S3 objects
    await Promise.all(
      log.photos.map((photo) => this.s3.deleteObject(photo.imageKey)),
    );

    return this.prisma.dailyLog.delete({ where: { id } });
  }

  async getPhotoUploadUrl(orgId: string, logId: string) {
    // Validate log exists
    const log = await this.prisma.dailyLog.findFirst({
      where: { id: logId, organizationId: orgId },
    });
    if (!log) throw new NotFoundException('Daily log not found');

    const key = `daily-log-photos/${orgId}/${logId}/${uuid()}.jpg`;
    const { url } = await this.s3.generateUploadUrl(key, 'image/jpeg');

    return { uploadUrl: url, imageKey: key };
  }

  async createPhoto(
    orgId: string,
    userId: string,
    logId: string,
    imageKey: string,
    caption?: string,
  ) {
    // Validate log exists
    const log = await this.prisma.dailyLog.findFirst({
      where: { id: logId, organizationId: orgId },
    });
    if (!log) throw new NotFoundException('Daily log not found');

    const photo = await this.prisma.dailyLogPhoto.create({
      data: {
        dailyLogId: logId,
        imageKey,
        caption,
        uploadedById: userId,
      },
    });

    const imageUrl = await this.s3.generateDownloadUrl(photo.imageKey);
    return { ...photo, imageUrl };
  }

  async deletePhoto(orgId: string, logId: string, photoId: string) {
    const log = await this.prisma.dailyLog.findFirst({
      where: { id: logId, organizationId: orgId },
    });
    if (!log) throw new NotFoundException('Daily log not found');

    const photo = await this.prisma.dailyLogPhoto.findFirst({
      where: { id: photoId, dailyLogId: logId },
    });
    if (!photo) throw new NotFoundException('Photo not found');

    await this.s3.deleteObject(photo.imageKey);
    return this.prisma.dailyLogPhoto.delete({ where: { id: photoId } });
  }
}
