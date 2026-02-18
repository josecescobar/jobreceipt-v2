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
import { DailyLogsService } from './daily-logs.service';
import { CreateDailyLogDto } from './dto/create-daily-log.dto';
import { UpdateDailyLogDto } from './dto/update-daily-log.dto';

@ApiTags('Daily Logs')
@Controller('daily-logs')
@UseGuards(ClerkAuthGuard, OrgMemberGuard)
@ApiBearerAuth()
export class DailyLogsController {
  constructor(private readonly dailyLogsService: DailyLogsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a daily log' })
  async create(
    @CurrentOrg() orgId: string,
    @CurrentUser('id') userId: string,
    @Body() body: CreateDailyLogDto,
  ) {
    return this.dailyLogsService.create(orgId, userId, body);
  }

  @Get()
  @ApiOperation({ summary: 'List daily logs for a job' })
  @ApiQuery({ name: 'jobId', required: true })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async findAll(
    @CurrentOrg() orgId: string,
    @Query('jobId') jobId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.dailyLogsService.findAll(orgId, {
      jobId,
      startDate,
      endDate,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get daily log details' })
  async findOne(@CurrentOrg() orgId: string, @Param('id') id: string) {
    return this.dailyLogsService.findOne(orgId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a daily log' })
  async update(
    @CurrentOrg() orgId: string,
    @Param('id') id: string,
    @Body() body: UpdateDailyLogDto,
  ) {
    return this.dailyLogsService.update(orgId, id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a daily log' })
  async remove(@CurrentOrg() orgId: string, @Param('id') id: string) {
    return this.dailyLogsService.remove(orgId, id);
  }

  @Post(':id/photos/upload-url')
  @ApiOperation({ summary: 'Get a presigned upload URL for a daily log photo' })
  async getPhotoUploadUrl(
    @CurrentOrg() orgId: string,
    @Param('id') logId: string,
  ) {
    return this.dailyLogsService.getPhotoUploadUrl(orgId, logId);
  }

  @Post(':id/photos')
  @ApiOperation({ summary: 'Create a daily log photo record' })
  async createPhoto(
    @CurrentOrg() orgId: string,
    @CurrentUser('id') userId: string,
    @Param('id') logId: string,
    @Body() body: { imageKey: string; caption?: string },
  ) {
    return this.dailyLogsService.createPhoto(
      orgId,
      userId,
      logId,
      body.imageKey,
      body.caption,
    );
  }

  @Delete(':id/photos/:photoId')
  @ApiOperation({ summary: 'Delete a daily log photo' })
  async deletePhoto(
    @CurrentOrg() orgId: string,
    @Param('id') logId: string,
    @Param('photoId') photoId: string,
  ) {
    return this.dailyLogsService.deletePhoto(orgId, logId, photoId);
  }
}
