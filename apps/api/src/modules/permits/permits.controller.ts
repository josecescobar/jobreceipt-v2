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
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import { OrgMemberGuard } from '../../common/guards/org-member.guard';
import { CurrentOrg } from '../../common/decorators/current-org.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PermitsService } from './permits.service';
import { CreatePermitDto } from './dto/create-permit.dto';
import { UpdatePermitDto } from './dto/update-permit.dto';
import { QueryPermitDto } from './dto/query-permit.dto';
import { CreateInspectionDto } from './dto/create-inspection.dto';
import { UpdateInspectionDto } from './dto/update-inspection.dto';

@ApiTags('permits')
@Controller('permits')
@UseGuards(ClerkAuthGuard, OrgMemberGuard)
@ApiBearerAuth()
export class PermitsController {
  constructor(private readonly permitsService: PermitsService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Get permit summary counts' })
  async getSummary(@CurrentOrg() orgId: string) {
    return this.permitsService.getSummary(orgId);
  }

  @Get('upcoming-inspections')
  @ApiOperation({ summary: 'Get upcoming inspections (next 30 days)' })
  async getUpcomingInspections(@CurrentOrg() orgId: string) {
    return this.permitsService.getUpcomingInspections(orgId);
  }

  @Get('expiring')
  @ApiOperation({ summary: 'Get expiring permits (next 90 days)' })
  async getExpiringPermits(@CurrentOrg() orgId: string) {
    return this.permitsService.getExpiringPermits(orgId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a permit' })
  async create(
    @CurrentOrg() orgId: string,
    @CurrentUser('id') userId: string,
    @Body() body: CreatePermitDto,
  ) {
    return this.permitsService.create(orgId, userId, body);
  }

  @Get()
  @ApiOperation({ summary: 'List permits' })
  async findAll(
    @CurrentOrg() orgId: string,
    @Query() query: QueryPermitDto,
  ) {
    return this.permitsService.findAll(orgId, query);
  }

  @Patch('inspections/:inspectionId')
  @ApiOperation({ summary: 'Update an inspection' })
  async updateInspection(
    @CurrentOrg() orgId: string,
    @Param('inspectionId') inspectionId: string,
    @Body() body: UpdateInspectionDto,
  ) {
    return this.permitsService.updateInspection(orgId, inspectionId, body);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get permit details' })
  async findOne(@CurrentOrg() orgId: string, @Param('id') id: string) {
    return this.permitsService.findOne(orgId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a permit' })
  async update(
    @CurrentOrg() orgId: string,
    @Param('id') id: string,
    @Body() body: UpdatePermitDto,
  ) {
    return this.permitsService.update(orgId, id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a permit' })
  async remove(@CurrentOrg() orgId: string, @Param('id') id: string) {
    return this.permitsService.remove(orgId, id);
  }

  @Post(':id/inspections')
  @ApiOperation({ summary: 'Schedule an inspection for a permit' })
  async addInspection(
    @CurrentOrg() orgId: string,
    @CurrentUser('id') userId: string,
    @Param('id') permitId: string,
    @Body() body: CreateInspectionDto,
  ) {
    return this.permitsService.addInspection(orgId, userId, permitId, body);
  }
}
