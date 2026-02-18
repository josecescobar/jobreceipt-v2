import {
  Controller,
  Get,
  Post,
  Patch,
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
import { ProgressBillingService } from './progress-billing.service';
import { CreateSOVDto } from './dto/create-sov.dto';
import { UpdateSOVDto } from './dto/update-sov.dto';
import { CreateSOVItemDto } from './dto/create-sov-item.dto';
import { CreateDrawRequestDto } from './dto/create-draw-request.dto';

@ApiTags('progress-billing')
@Controller('progress-billing')
@UseGuards(ClerkAuthGuard, OrgMemberGuard)
@ApiBearerAuth()
export class ProgressBillingController {
  constructor(private readonly progressBillingService: ProgressBillingService) {}

  // ─── Schedule of Values ──────────────────────────────────

  @Post('sov')
  @ApiOperation({ summary: 'Create a Schedule of Values' })
  async createSOV(
    @CurrentOrg() orgId: string,
    @CurrentUser('id') userId: string,
    @Body() body: CreateSOVDto,
  ) {
    return this.progressBillingService.createSOV(orgId, userId, body);
  }

  @Get('sov')
  @ApiOperation({ summary: 'List all Schedules of Values' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async listSOVs(
    @CurrentOrg() orgId: string,
    @Query('search') search?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.progressBillingService.listSOVs(orgId, {
      search,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
    });
  }

  @Get('sov/job/:jobId')
  @ApiOperation({ summary: 'Get SOV by job ID' })
  async getSOVByJob(
    @CurrentOrg() orgId: string,
    @Param('jobId') jobId: string,
  ) {
    return this.progressBillingService.getSOVByJob(orgId, jobId);
  }

  @Get('sov/:id')
  @ApiOperation({ summary: 'Get Schedule of Values details' })
  async getSOV(
    @CurrentOrg() orgId: string,
    @Param('id') id: string,
  ) {
    return this.progressBillingService.getSOV(orgId, id);
  }

  @Patch('sov/:id')
  @ApiOperation({ summary: 'Update a Schedule of Values' })
  async updateSOV(
    @CurrentOrg() orgId: string,
    @Param('id') id: string,
    @Body() body: UpdateSOVDto,
  ) {
    return this.progressBillingService.updateSOV(orgId, id, body);
  }

  @Post('sov/:id/items')
  @ApiOperation({ summary: 'Add an item to a Schedule of Values' })
  async addSOVItem(
    @CurrentOrg() orgId: string,
    @Param('id') id: string,
    @Body() body: CreateSOVItemDto,
  ) {
    return this.progressBillingService.addSOVItem(orgId, id, body);
  }

  @Get('sov/:id/summary')
  @ApiOperation({ summary: 'Get progress billing summary for an SOV' })
  async getSummary(
    @CurrentOrg() orgId: string,
    @Param('id') id: string,
  ) {
    return this.progressBillingService.getSummary(orgId, id);
  }

  // ─── Draw Requests ───────────────────────────────────────

  @Post('draw-requests')
  @ApiOperation({ summary: 'Create a new Draw Request' })
  async createDrawRequest(
    @CurrentOrg() orgId: string,
    @CurrentUser('id') userId: string,
    @Body() body: CreateDrawRequestDto,
  ) {
    return this.progressBillingService.createDrawRequest(orgId, userId, body);
  }

  @Get('draw-requests/:id')
  @ApiOperation({ summary: 'Get Draw Request details' })
  async getDrawRequest(
    @CurrentOrg() orgId: string,
    @Param('id') id: string,
  ) {
    return this.progressBillingService.getDrawRequest(orgId, id);
  }

  @Post('draw-requests/:id/submit')
  @ApiOperation({ summary: 'Submit a Draft Draw Request for approval' })
  async submitDrawRequest(
    @CurrentOrg() orgId: string,
    @Param('id') id: string,
  ) {
    return this.progressBillingService.submitDrawRequest(orgId, id);
  }

  @Post('draw-requests/:id/approve')
  @ApiOperation({ summary: 'Approve a submitted Draw Request (auto-generates invoice)' })
  async approveDrawRequest(
    @CurrentOrg() orgId: string,
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.progressBillingService.approveDrawRequest(orgId, id, userId);
  }
}
