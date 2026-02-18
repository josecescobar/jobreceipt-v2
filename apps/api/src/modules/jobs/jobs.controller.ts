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
import { JobsService } from './jobs.service';
import { ReportService } from './report.service';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { QueryJobDto } from './dto/query-job.dto';

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
