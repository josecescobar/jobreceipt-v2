import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import { OrgMemberGuard } from '../../common/guards/org-member.guard';
import { CurrentOrg } from '../../common/decorators/current-org.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { SubcontractorsService } from './subcontractors.service';
import { CreateSubcontractorDto } from './dto/create-subcontractor.dto';
import { UpdateSubcontractorDto } from './dto/update-subcontractor.dto';
import { QuerySubcontractorDto } from './dto/query-subcontractor.dto';

@ApiTags('Subcontractors')
@Controller('subcontractors')
@UseGuards(ClerkAuthGuard, OrgMemberGuard)
@ApiBearerAuth()
export class SubcontractorsController {
  constructor(
    private readonly subcontractorsService: SubcontractorsService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a subcontractor' })
  async create(
    @CurrentOrg() orgId: string,
    @CurrentUser('id') userId: string,
    @Body() body: CreateSubcontractorDto,
  ) {
    return this.subcontractorsService.create(orgId, userId, body);
  }

  @Get()
  @ApiOperation({ summary: 'List subcontractors for the organization' })
  async findAll(
    @CurrentOrg() orgId: string,
    @Query() query: QuerySubcontractorDto,
  ) {
    return this.subcontractorsService.findAll(orgId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a subcontractor by ID' })
  async findOne(@CurrentOrg() orgId: string, @Param('id') id: string) {
    return this.subcontractorsService.findOne(orgId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a subcontractor' })
  async update(
    @CurrentOrg() orgId: string,
    @Param('id') id: string,
    @Body() body: UpdateSubcontractorDto,
  ) {
    return this.subcontractorsService.update(orgId, id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a subcontractor' })
  async remove(@CurrentOrg() orgId: string, @Param('id') id: string) {
    return this.subcontractorsService.remove(orgId, id);
  }

  @Get(':id/summary')
  @ApiOperation({ summary: 'Get spending summary for a subcontractor' })
  async getSummary(@CurrentOrg() orgId: string, @Param('id') id: string) {
    return this.subcontractorsService.getSummary(orgId, id);
  }
}
