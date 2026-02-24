import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import { OrgMemberGuard } from '../../common/guards/org-member.guard';
import { CurrentOrg } from '../../common/decorators/current-org.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JobsService } from './jobs.service';
import { ReportService } from './report.service';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { QueryJobDto } from './dto/query-job.dto';
import { CreatePhotoDto } from './dto/create-photo.dto';
import { UpdatePhotoAnnotationsDto } from './dto/update-photo-annotations.dto';

@ApiTags('Jobs')
@Controller('jobs')
@UseGuards(ClerkAuthGuard, OrgMemberGuard)
@ApiBearerAuth()
export class JobsController {
  constructor(
    private readonly jobsService: JobsService,
    private readonly reportService: ReportService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new job' })
  async create(
    @CurrentOrg() orgId: string,
    @Body() body: CreateJobDto,
  ) {
    return this.jobsService.create(orgId, body);
  }

  @Get()
  @ApiOperation({ summary: 'List jobs' })
  async findAll(
    @CurrentOrg() orgId: string,
    @Query() query: QueryJobDto,
  ) {
    return this.jobsService.findAll(orgId, {
      status: query.status,
      search: query.search,
      page: query.page ?? 1,
      limit: query.limit ?? 20,
    });
  }

  @Post(':id/photos/upload-url')
  @ApiOperation({ summary: 'Get a presigned URL for job photo upload' })
  async getPhotoUploadUrl(
    @CurrentOrg() orgId: string,
    @Param('id') id: string,
  ) {
    return this.jobsService.requestPhotoUploadUrl(orgId, id);
  }

  @Post(':id/photos')
  @ApiOperation({ summary: 'Create a job photo record after upload' })
  async createPhoto(
    @CurrentOrg() orgId: string,
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() body: CreatePhotoDto,
  ) {
    return this.jobsService.createPhoto(orgId, id, userId, body.imageKey, body.caption);
  }

  @Get(':id/photos')
  @ApiOperation({ summary: 'List progress photos for a job' })
  async getPhotos(
    @CurrentOrg() orgId: string,
    @Param('id') id: string,
  ) {
    return this.jobsService.getPhotos(orgId, id);
  }

  @Patch(':id/photos/:photoId/annotations')
  @ApiOperation({ summary: 'Save annotations for a job photo' })
  async updatePhotoAnnotations(
    @CurrentOrg() orgId: string,
    @Param('id') id: string,
    @Param('photoId') photoId: string,
    @Body() body: UpdatePhotoAnnotationsDto,
  ) {
    return this.jobsService.updatePhotoAnnotations(
      orgId,
      id,
      photoId,
      body.annotations,
      body.annotatedImageKey,
    );
  }

  @Post(':id/photos/:photoId/annotated-upload-url')
  @ApiOperation({ summary: 'Get presigned URL for annotated photo upload' })
  async getAnnotatedUploadUrl(
    @CurrentOrg() orgId: string,
    @Param('id') id: string,
    @Param('photoId') photoId: string,
  ) {
    return this.jobsService.getAnnotatedUploadUrl(orgId, id, photoId);
  }

  @Delete(':id/photos/:photoId')
  @ApiOperation({ summary: 'Delete a job photo' })
  async deletePhoto(
    @CurrentOrg() orgId: string,
    @Param('id') id: string,
    @Param('photoId') photoId: string,
  ) {
    return this.jobsService.deletePhoto(orgId, id, photoId);
  }

  @Get(':id/report')
  @ApiOperation({ summary: 'Generate PDF expense report for a job' })
  async getReport(
    @CurrentOrg() orgId: string,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const { buffer, filename } = await this.reportService.generateJobReport(orgId, id);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get job details' })
  async findOne(@CurrentOrg() orgId: string, @Param('id') id: string) {
    return this.jobsService.findOne(orgId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a job' })
  async update(
    @CurrentOrg() orgId: string,
    @Param('id') id: string,
    @Body() body: UpdateJobDto,
  ) {
    return this.jobsService.update(orgId, id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Archive a job (soft delete)' })
  async archive(@CurrentOrg() orgId: string, @Param('id') id: string) {
    return this.jobsService.archive(orgId, id);
  }

  @Get(':id/budget')
  @ApiOperation({ summary: 'Get real-time budget vs actual for a job' })
  async getBudget(@CurrentOrg() orgId: string, @Param('id') id: string) {
    return this.jobsService.getBudget(orgId, id);
  }
}
