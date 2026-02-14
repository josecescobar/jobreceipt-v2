import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import { OrgMemberGuard } from '../../common/guards/org-member.guard';
import { CurrentOrg } from '../../common/decorators/current-org.decorator';
import { JobsService } from './jobs.service';

@ApiTags('Jobs')
@Controller('jobs')
@UseGuards(ClerkAuthGuard, OrgMemberGuard)
@ApiBearerAuth()
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new job' })
  async create(
    @CurrentOrg() orgId: string,
    @Body() body: {
      name: string;
      customerName?: string;
      customerAddress?: string;
      customerLat?: number;
      customerLng?: number;
      budgetTotal?: number;
      budgetMaterials?: number;
      budgetLabor?: number;
      startDate?: string;
      endDate?: string;
      notes?: string;
    },
  ) {
    return this.jobsService.create(orgId, body);
  }

  @Get()
  @ApiOperation({ summary: 'List jobs' })
  @ApiQuery({ name: 'status', required: false, enum: ['ACTIVE', 'COMPLETED', 'ARCHIVED'] })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async findAll(
    @CurrentOrg() orgId: string,
    @Query('status') status?: 'ACTIVE' | 'COMPLETED' | 'ARCHIVED',
    @Query('search') search?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.jobsService.findAll(orgId, {
      status,
      search,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
    });
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
    @Body() body: any,
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
