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
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { TimeTrackingService } from './time-tracking.service';
import { CreateTimeEntryDto } from './dto/create-time-entry.dto';
import { UpdateTimeEntryDto } from './dto/update-time-entry.dto';

@ApiTags('Time Tracking')
@Controller('time-entries')
@UseGuards(ClerkAuthGuard, OrgMemberGuard)
@ApiBearerAuth()
export class TimeTrackingController {
  constructor(private readonly timeTrackingService: TimeTrackingService) {}

  @Post()
  @ApiOperation({ summary: 'Create a time entry' })
  async create(
    @CurrentOrg() orgId: string,
    @CurrentUser('id') userId: string,
    @Body() body: CreateTimeEntryDto,
  ) {
    return this.timeTrackingService.create(orgId, userId, body);
  }

  @Get()
  @ApiOperation({ summary: 'List time entries with filters' })
  @ApiQuery({ name: 'jobId', required: false })
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async findAll(
    @CurrentOrg() orgId: string,
    @Query('jobId') jobId?: string,
    @Query('userId') userId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.timeTrackingService.findAll(orgId, {
      jobId,
      userId,
      startDate,
      endDate,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
    });
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get time tracking summary stats' })
  @ApiQuery({ name: 'jobId', required: false })
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  async getSummary(
    @CurrentOrg() orgId: string,
    @Query('jobId') jobId?: string,
    @Query('userId') userId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.timeTrackingService.getSummary(orgId, { jobId, userId, startDate, endDate });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get time entry details' })
  async findOne(@CurrentOrg() orgId: string, @Param('id') id: string) {
    return this.timeTrackingService.findOne(orgId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a time entry' })
  async update(
    @CurrentOrg() orgId: string,
    @Param('id') id: string,
    @Body() body: UpdateTimeEntryDto,
  ) {
    return this.timeTrackingService.update(orgId, id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a time entry' })
  async remove(@CurrentOrg() orgId: string, @Param('id') id: string) {
    return this.timeTrackingService.remove(orgId, id);
  }
}
