import { Controller, Get, Post, Body, Res, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Response } from 'express';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import { OrgMemberGuard } from '../../common/guards/org-member.guard';
import { CurrentOrg } from '../../common/decorators/current-org.decorator';
import { ReportsService } from './reports.service';
import { ReportGeneratorService } from './report-generator.service';
import { GenerateReportDto } from './dto/generate-report.dto';

@Controller('reports')
@UseGuards(ClerkAuthGuard, OrgMemberGuard)
@ApiBearerAuth()
@ApiTags('Reports')
export class ReportsController {
  constructor(
    private reportsService: ReportsService,
    private reportGeneratorService: ReportGeneratorService,
  ) {}

  @Get('templates')
  @ApiOperation({ summary: 'Get available report templates' })
  getTemplates() {
    return this.reportsService.getTemplates();
  }

  @Post('generate')
  @ApiOperation({ summary: 'Generate a report (PDF or CSV)' })
  async generate(
    @CurrentOrg() orgId: string,
    @Body() dto: GenerateReportDto,
    @Res() res: Response,
  ) {
    const { buffer, filename, contentType } =
      await this.reportGeneratorService.generate(orgId, dto);

    res.set({
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }
}
