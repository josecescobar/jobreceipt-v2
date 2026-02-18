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
import { PunchListsService } from './punch-lists.service';
import { CreatePunchListItemDto } from './dto/create-punch-list-item.dto';
import { UpdatePunchListItemDto } from './dto/update-punch-list-item.dto';

@ApiTags('Punch Lists')
@Controller('punch-lists')
@UseGuards(ClerkAuthGuard, OrgMemberGuard)
@ApiBearerAuth()
export class PunchListsController {
  constructor(private readonly punchListsService: PunchListsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a punch list item' })
  async create(
    @CurrentOrg() orgId: string,
    @CurrentUser('id') userId: string,
    @Body() body: CreatePunchListItemDto,
  ) {
    return this.punchListsService.create(orgId, userId, body);
  }

  @Get()
  @ApiOperation({ summary: 'List punch list items for a job' })
  @ApiQuery({ name: 'jobId', required: true })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'assignedToId', required: false })
  @ApiQuery({ name: 'priority', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async findAll(
    @CurrentOrg() orgId: string,
    @Query('jobId') jobId: string,
    @Query('status') status?: string,
    @Query('assignedToId') assignedToId?: string,
    @Query('priority') priority?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.punchListsService.findAll(orgId, {
      jobId,
      status,
      assignedToId,
      priority,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
    });
  }

  @Get('job-summary/:jobId')
  @ApiOperation({ summary: 'Get punch list summary for a job' })
  async getJobSummary(
    @CurrentOrg() orgId: string,
    @Param('jobId') jobId: string,
  ) {
    return this.punchListsService.getJobSummary(orgId, jobId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get punch list item details' })
  async findOne(@CurrentOrg() orgId: string, @Param('id') id: string) {
    return this.punchListsService.findOne(orgId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a punch list item' })
  async update(
    @CurrentOrg() orgId: string,
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() body: UpdatePunchListItemDto,
  ) {
    return this.punchListsService.update(orgId, id, userId, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a punch list item' })
  async remove(@CurrentOrg() orgId: string, @Param('id') id: string) {
    return this.punchListsService.remove(orgId, id);
  }

  @Post(':id/photos/upload-url')
  @ApiOperation({ summary: 'Get a presigned upload URL for a punch list photo' })
  async getPhotoUploadUrl(
    @CurrentOrg() orgId: string,
    @Param('id') itemId: string,
  ) {
    return this.punchListsService.getPhotoUploadUrl(orgId, itemId);
  }

  @Post(':id/photos')
  @ApiOperation({ summary: 'Create a punch list photo record' })
  async createPhoto(
    @CurrentOrg() orgId: string,
    @CurrentUser('id') userId: string,
    @Param('id') itemId: string,
    @Body() body: { imageKey: string; caption?: string },
  ) {
    return this.punchListsService.createPhoto(
      orgId,
      userId,
      itemId,
      body.imageKey,
      body.caption,
    );
  }

  @Delete(':id/photos/:photoId')
  @ApiOperation({ summary: 'Delete a punch list photo' })
  async deletePhoto(
    @CurrentOrg() orgId: string,
    @Param('id') itemId: string,
    @Param('photoId') photoId: string,
  ) {
    return this.punchListsService.deletePhoto(orgId, itemId, photoId);
  }
}
