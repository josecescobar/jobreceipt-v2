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
import { CrewSchedulingService } from './crew-scheduling.service';
import { CreateCrewAssignmentDto } from './dto/create-crew-assignment.dto';
import { UpdateCrewAssignmentDto } from './dto/update-crew-assignment.dto';
import { QueryCrewAssignmentDto } from './dto/query-crew-assignment.dto';

@ApiTags('Crew Scheduling')
@Controller('crew-assignments')
@UseGuards(ClerkAuthGuard, OrgMemberGuard)
@ApiBearerAuth()
export class CrewSchedulingController {
  constructor(private readonly crewSchedulingService: CrewSchedulingService) {}

  @Post()
  @ApiOperation({ summary: 'Create crew assignments (batch)' })
  async create(
    @CurrentOrg() orgId: string,
    @CurrentUser('id') userId: string,
    @Body() body: CreateCrewAssignmentDto,
  ) {
    return this.crewSchedulingService.create(orgId, userId, body);
  }

  @Get()
  @ApiOperation({ summary: 'List crew assignments with filters' })
  async findAll(
    @CurrentOrg() orgId: string,
    @Query() query: QueryCrewAssignmentDto,
  ) {
    return this.crewSchedulingService.findAll(orgId, query);
  }

  @Get('my-schedule')
  @ApiOperation({ summary: 'Get current user schedule' })
  async getMySchedule(
    @CurrentOrg() orgId: string,
    @CurrentUser('id') userId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.crewSchedulingService.getMySchedule(orgId, userId, startDate, endDate);
  }

  @Get('today')
  @ApiOperation({ summary: 'Get today assignments grouped by job' })
  async getToday(@CurrentOrg() orgId: string) {
    return this.crewSchedulingService.getToday(orgId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get crew assignment details' })
  async findOne(@CurrentOrg() orgId: string, @Param('id') id: string) {
    return this.crewSchedulingService.findOne(orgId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a crew assignment' })
  async update(
    @CurrentOrg() orgId: string,
    @Param('id') id: string,
    @Body() body: UpdateCrewAssignmentDto,
  ) {
    return this.crewSchedulingService.update(orgId, id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a crew assignment' })
  async remove(@CurrentOrg() orgId: string, @Param('id') id: string) {
    return this.crewSchedulingService.remove(orgId, id);
  }
}
