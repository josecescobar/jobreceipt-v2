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
import { EquipmentService } from './equipment.service';
import { CreateEquipmentDto } from './dto/create-equipment.dto';
import { UpdateEquipmentDto } from './dto/update-equipment.dto';
import { CheckOutEquipmentDto } from './dto/check-out-equipment.dto';
import { CreateMaintenanceLogDto } from './dto/create-maintenance-log.dto';

@ApiTags('Equipment')
@Controller('equipment')
@UseGuards(ClerkAuthGuard, OrgMemberGuard)
@ApiBearerAuth()
export class EquipmentController {
  constructor(private readonly equipmentService: EquipmentService) {}

  @Post()
  @ApiOperation({ summary: 'Create equipment' })
  async create(
    @CurrentOrg() orgId: string,
    @CurrentUser('id') userId: string,
    @Body() body: CreateEquipmentDto,
  ) {
    return this.equipmentService.create(orgId, userId, body);
  }

  @Get()
  @ApiOperation({ summary: 'List equipment' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async findAll(
    @CurrentOrg() orgId: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.equipmentService.findAll(orgId, {
      status,
      search,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
    });
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get equipment summary counts' })
  async getSummary(@CurrentOrg() orgId: string) {
    return this.equipmentService.getSummary(orgId);
  }

  @Get('upcoming-maintenance')
  @ApiOperation({ summary: 'Get upcoming maintenance items' })
  async getUpcomingMaintenance(@CurrentOrg() orgId: string) {
    return this.equipmentService.getUpcomingMaintenance(orgId);
  }

  @Get('job/:jobId')
  @ApiOperation({ summary: 'Get equipment assigned to a job' })
  async getJobEquipment(
    @CurrentOrg() orgId: string,
    @Param('jobId') jobId: string,
  ) {
    return this.equipmentService.getJobEquipment(orgId, jobId);
  }

  @Post('check-out')
  @ApiOperation({ summary: 'Check out equipment to a job' })
  async checkOut(
    @CurrentOrg() orgId: string,
    @CurrentUser('id') userId: string,
    @Body() body: CheckOutEquipmentDto,
  ) {
    return this.equipmentService.checkOut(orgId, userId, body);
  }

  @Post('maintenance')
  @ApiOperation({ summary: 'Create a maintenance log entry' })
  async createMaintenanceLog(
    @CurrentOrg() orgId: string,
    @CurrentUser('id') userId: string,
    @Body() body: CreateMaintenanceLogDto,
  ) {
    return this.equipmentService.createMaintenanceLog(orgId, userId, body);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get equipment details' })
  async findOne(@CurrentOrg() orgId: string, @Param('id') id: string) {
    return this.equipmentService.findOne(orgId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update equipment' })
  async update(
    @CurrentOrg() orgId: string,
    @Param('id') id: string,
    @Body() body: UpdateEquipmentDto,
  ) {
    return this.equipmentService.update(orgId, id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete equipment' })
  async remove(@CurrentOrg() orgId: string, @Param('id') id: string) {
    return this.equipmentService.remove(orgId, id);
  }

  @Post(':assignmentId/check-in')
  @ApiOperation({ summary: 'Check in equipment from a job' })
  async checkIn(
    @CurrentOrg() orgId: string,
    @CurrentUser('id') userId: string,
    @Param('assignmentId') assignmentId: string,
    @Body() body: { notes?: string },
  ) {
    return this.equipmentService.checkIn(orgId, assignmentId, userId, body.notes);
  }
}
