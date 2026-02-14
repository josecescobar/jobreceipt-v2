import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import { OrgMemberGuard } from '../../common/guards/org-member.guard';
import { CurrentOrg } from '../../common/decorators/current-org.decorator';
import { CostCodesService } from './cost-codes.service';

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
    @Body() body: { code: string; name: string; category: 'MATERIALS' | 'LABOR' | 'EQUIPMENT' | 'SUBCONTRACTOR' | 'OVERHEAD' },
  ) {
    return this.costCodesService.create(orgId, body);
  }
}
