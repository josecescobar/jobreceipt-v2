import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CreateJobDto } from './dto/create-job.dto';
import { ListJobsDto } from './dto/list-jobs.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { JobsService } from './jobs.service';

@ApiTags('jobs')
@ApiBearerAuth()
@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Get()
  listJobs(@Query() query: ListJobsDto) {
    return this.jobsService.list(query);
  }

  @Post()
  createJob(@Body() dto: CreateJobDto) {
    return this.jobsService.create(dto);
  }

  @Get(':id')
  getJob(@Param('id') id: string) {
    return this.jobsService.getById(id);
  }

  @Patch(':id')
  updateJob(@Param('id') id: string, @Body() dto: UpdateJobDto) {
    return this.jobsService.update(id, dto);
  }

  @Get(':id/budget')
  budget(@Param('id') id: string) {
    return this.jobsService.getBudget(id);
  }
}
