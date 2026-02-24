import { Controller, Get, Post, Param, Res, Header } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Response } from 'express';
import { PublicService } from './public.service';
import { InvoiceReportService } from '../invoices/invoice-report.service';
import { EstimateReportService } from '../estimates/estimate-report.service';

@ApiTags('Public')
@Controller('public')
@Throttle([{ ttl: 60_000, limit: 20 }])
export class PublicController {
  constructor(
    private readonly publicService: PublicService,
    private readonly invoiceReportService: InvoiceReportService,
    private readonly estimateReportService: EstimateReportService,
  ) {}

  @Get('invoice/:token')
  @ApiOperation({ summary: 'View shared invoice (public, no auth)' })
  @Header('Content-Type', 'text/html')
  async viewInvoice(@Param('token') token: string) {
    const invoice = await this.publicService.findInvoiceByToken(token);
    return this.publicService.renderInvoiceHtml(invoice);
  }

  @Get('invoice/:token/pdf')
  @ApiOperation({ summary: 'Download shared invoice PDF (public, no auth)' })
  async downloadInvoicePdf(
    @Param('token') token: string,
    @Res() res: Response,
  ) {
    const invoice = await this.publicService.findInvoiceByToken(token);
    const { buffer, filename } =
      await this.invoiceReportService.generatePdfFromData(invoice);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }

  @Get('estimate/:token')
  @ApiOperation({ summary: 'View shared estimate (public, no auth)' })
  @Header('Content-Type', 'text/html')
  async viewEstimate(@Param('token') token: string) {
    const estimate = await this.publicService.findEstimateByToken(token);
    return this.publicService.renderEstimateHtml(estimate);
  }

  @Get('estimate/:token/pdf')
  @ApiOperation({ summary: 'Download shared estimate PDF (public, no auth)' })
  async downloadEstimatePdf(
    @Param('token') token: string,
    @Res() res: Response,
  ) {
    const estimate = await this.publicService.findEstimateByToken(token);
    const { buffer, filename } =
      await this.estimateReportService.generatePdfFromData(estimate);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }

  @Post('estimate/:token/accept')
  @ApiOperation({ summary: 'Accept a shared estimate (public, no auth)' })
  @Header('Content-Type', 'text/html')
  async acceptEstimate(@Param('token') token: string) {
    const estimate = await this.publicService.acceptEstimate(token);
    return this.publicService.renderEstimateHtml(estimate);
  }
}
