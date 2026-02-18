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
import { MaterialsService } from './materials.service';
import { CreateMaterialItemDto } from './dto/create-material-item.dto';
import { UpdateMaterialItemDto } from './dto/update-material-item.dto';
import { QueryMaterialItemDto } from './dto/query-material-item.dto';
import { LogMaterialUsageDto } from './dto/log-material-usage.dto';

@ApiTags('Materials')
@Controller('materials')
@UseGuards(ClerkAuthGuard, OrgMemberGuard)
@ApiBearerAuth()
export class MaterialsController {
  constructor(private readonly materialsService: MaterialsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a material item' })
  async create(
    @CurrentOrg() orgId: string,
    @CurrentUser('id') userId: string,
    @Body() body: CreateMaterialItemDto,
  ) {
    return this.materialsService.create(orgId, userId, body);
  }

  @Get()
  @ApiOperation({ summary: 'List material items' })
  async findAll(
    @CurrentOrg() orgId: string,
    @Query() query: QueryMaterialItemDto,
  ) {
    return this.materialsService.findAll(orgId, query);
  }

  @Get('job-summary/:jobId')
  @ApiOperation({ summary: 'Get material summary for a job' })
  async getJobSummary(
    @CurrentOrg() orgId: string,
    @Param('jobId') jobId: string,
  ) {
    return this.materialsService.getJobSummary(orgId, jobId);
  }

  @Get('inventory-summary')
  @ApiOperation({ summary: 'Get org-wide inventory summary' })
  async getInventorySummary(@CurrentOrg() orgId: string) {
    return this.materialsService.getInventorySummary(orgId);
  }

  @Post('log-usage')
  @ApiOperation({ summary: 'Log material usage' })
  async logUsage(
    @CurrentOrg() orgId: string,
    @CurrentUser('id') userId: string,
    @Body() body: LogMaterialUsageDto,
  ) {
    return this.materialsService.logUsage(orgId, userId, body);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get material item details' })
  async findOne(@CurrentOrg() orgId: string, @Param('id') id: string) {
    return this.materialsService.findOne(orgId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a material item' })
  async update(
    @CurrentOrg() orgId: string,
    @Param('id') id: string,
    @Body() body: UpdateMaterialItemDto,
  ) {
    return this.materialsService.update(orgId, id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a material item' })
  async remove(@CurrentOrg() orgId: string, @Param('id') id: string) {
    return this.materialsService.remove(orgId, id);
  }
}
