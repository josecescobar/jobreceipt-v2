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
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
} from '@nestjs/swagger';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import { OrgMemberGuard } from '../../common/guards/org-member.guard';
import { CurrentOrg } from '../../common/decorators/current-org.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { SafetyService } from './safety.service';
import { CreateSafetyInspectionDto } from './dto/create-safety-inspection.dto';
import { UpdateSafetyInspectionDto } from './dto/update-safety-inspection.dto';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { UpdateIncidentDto } from './dto/update-incident.dto';

@ApiTags('safety')
@Controller('safety')
@UseGuards(ClerkAuthGuard, OrgMemberGuard)
@ApiBearerAuth()
export class SafetyController {
  constructor(private readonly safetyService: SafetyService) {}

  // ─── Static routes first ──────────────────────────────

  @Get('templates')
  @ApiOperation({ summary: 'Get available safety inspection templates' })
  getTemplates() {
    return this.safetyService.getTemplates();
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get safety summary for the organization' })
  async getSummary(@CurrentOrg() orgId: string) {
    return this.safetyService.getSummary(orgId);
  }

  // ─── Inspections ──────────────────────────────────────

  @Post('inspections')
  @ApiOperation({ summary: 'Create a safety inspection from a template' })
  async createInspection(
    @CurrentOrg() orgId: string,
    @CurrentUser('id') userId: string,
    @Body() body: CreateSafetyInspectionDto,
  ) {
    return this.safetyService.createInspection(orgId, userId, body);
  }

  @Get('inspections')
  @ApiOperation({ summary: 'List safety inspections' })
  @ApiQuery({ name: 'jobId', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async findAllInspections(
    @CurrentOrg() orgId: string,
    @Query('jobId') jobId?: string,
    @Query('status') status?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.safetyService.findAllInspections(orgId, {
      jobId,
      status,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
    });
  }

  @Get('inspections/:id')
  @ApiOperation({ summary: 'Get a single safety inspection' })
  async findOneInspection(
    @CurrentOrg() orgId: string,
    @Param('id') id: string,
  ) {
    return this.safetyService.findOneInspection(orgId, id);
  }

  @Patch('inspections/:id')
  @ApiOperation({ summary: 'Update a safety inspection' })
  async updateInspection(
    @CurrentOrg() orgId: string,
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() body: UpdateSafetyInspectionDto,
  ) {
    return this.safetyService.updateInspection(orgId, id, userId, body);
  }

  // ─── Incidents ────────────────────────────────────────

  @Post('incidents')
  @ApiOperation({ summary: 'Report a safety incident' })
  async createIncident(
    @CurrentOrg() orgId: string,
    @CurrentUser('id') userId: string,
    @Body() body: CreateIncidentDto,
  ) {
    return this.safetyService.createIncident(orgId, userId, body);
  }

  @Get('incidents')
  @ApiOperation({ summary: 'List safety incidents' })
  @ApiQuery({ name: 'jobId', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'type', required: false })
  @ApiQuery({ name: 'severity', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async findAllIncidents(
    @CurrentOrg() orgId: string,
    @Query('jobId') jobId?: string,
    @Query('status') status?: string,
    @Query('type') type?: string,
    @Query('severity') severity?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.safetyService.findAllIncidents(orgId, {
      jobId,
      status,
      type,
      severity,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
    });
  }

  @Get('incidents/:id')
  @ApiOperation({ summary: 'Get a single safety incident' })
  async findOneIncident(
    @CurrentOrg() orgId: string,
    @Param('id') id: string,
  ) {
    return this.safetyService.findOneIncident(orgId, id);
  }

  @Patch('incidents/:id')
  @ApiOperation({ summary: 'Update a safety incident' })
  async updateIncident(
    @CurrentOrg() orgId: string,
    @Param('id') id: string,
    @Body() body: UpdateIncidentDto,
  ) {
    return this.safetyService.updateIncident(orgId, id, body);
  }

  @Post('incidents/:id/photos/upload-url')
  @ApiOperation({ summary: 'Get a presigned upload URL for incident photo' })
  async getPhotoUploadUrl(
    @CurrentOrg() orgId: string,
    @Param('id') incidentId: string,
  ) {
    return this.safetyService.getPhotoUploadUrl(orgId, incidentId);
  }

  @Post('incidents/:id/photos')
  @ApiOperation({ summary: 'Create an incident photo record' })
  async createIncidentPhoto(
    @CurrentOrg() orgId: string,
    @CurrentUser('id') userId: string,
    @Param('id') incidentId: string,
    @Body() body: { imageKey: string; caption?: string },
  ) {
    return this.safetyService.createIncidentPhoto(
      orgId,
      incidentId,
      userId,
      body.imageKey,
      body.caption,
    );
  }
}
