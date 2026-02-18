import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import { OrgMemberGuard } from '../../common/guards/org-member.guard';
import { CurrentOrg } from '../../common/decorators/current-org.decorator';
import { CostCodesService } from './cost-codes.service';
import { CreateCostCodeDto } from './dto/create-cost-code.dto';
import { UpdateCostCodeDto } from './dto/update-cost-code.dto';

@ApiTags('Cost Codes')
@Controller('cost-codes')
@UseGuards(ClerkAuthGuard, OrgMemberGuard)
@ApiBearerAuth()
export class CostCodesController {
  constructor(private readonly costCodesService: CostCodesService) {}

  @Get()
  @ApiOperation({ summary: 'List cost codes for the organization' })
  async findAll(@CurrentOrg() orgId: string) {
    return this.costCodesService.findAll(orgId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a custom cost code' })
  async create(
    @CurrentOrg() orgId: string,
    @Body() body: CreateCostCodeDto,
  ) {
    return this.costCodesService.create(orgId, body);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a cost code by ID' })
  async findOne(@CurrentOrg() orgId: string, @Param('id') id: string) {
    return this.costCodesService.findOne(orgId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a cost code' })
  async update(
    @CurrentOrg() orgId: string,
    @Param('id') id: string,
    @Body() body: UpdateCostCodeDto,
  ) {
    return this.costCodesService.update(orgId, id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a cost code' })
  async remove(@CurrentOrg() orgId: string, @Param('id') id: string) {
    return this.costCodesService.remove(orgId, id);
  }

  @Post('seed-defaults')
  @ApiOperation({ summary: 'Seed default cost codes for the organization' })
  async seedDefaults(@CurrentOrg() orgId: string) {
    return this.costCodesService.seedDefaults(orgId);
  }
}
