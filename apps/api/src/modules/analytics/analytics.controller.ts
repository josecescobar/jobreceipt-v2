import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import { OrgMemberGuard } from '../../common/guards/org-member.guard';
import { CurrentOrg } from '../../common/decorators/current-org.decorator';
import { AnalyticsService } from './analytics.service';
import { QueryAnalyticsDto } from './dto/query-analytics.dto';

@ApiTags('Analytics')
@Controller('analytics')
@UseGuards(ClerkAuthGuard, OrgMemberGuard)
@ApiBearerAuth()
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('weekly-comparison')
  @ApiOperation({ summary: 'Get this week vs last week spending comparison' })
  async getWeeklyComparison(@CurrentOrg() orgId: string) {
    return this.analyticsService.getWeeklyComparison(orgId);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get analytics summary with aggregated data' })
  async getSummary(
    @CurrentOrg() orgId: string,
    @Query() query: QueryAnalyticsDto,
  ) {
    return this.analyticsService.getSummary(orgId, query);
  }

  @Get('tax-summary')
  @ApiOperation({ summary: 'Get tax summary grouped by Schedule C categories' })
  async getTaxSummary(
    @CurrentOrg() orgId: string,
    @Query('year') yearStr?: string,
  ) {
    const year = yearStr ? parseInt(yearStr, 10) : new Date().getFullYear();
    return this.analyticsService.getTaxSummary(orgId, year);
  }

  @Get('profitability')
  @ApiOperation({ summary: 'Get job profitability analysis with income vs expenses' })
  async getJobProfitability(
    @CurrentOrg() orgId: string,
    @Query() query: QueryAnalyticsDto,
  ) {
    return this.analyticsService.getJobProfitability(orgId, query);
  }
}
