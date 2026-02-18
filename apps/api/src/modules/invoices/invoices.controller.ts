import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import { OrgMemberGuard } from '../../common/guards/org-member.guard';
import { CurrentOrg } from '../../common/decorators/current-org.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { InvoicesService } from './invoices.service';
import { InvoiceReportService } from './invoice-report.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { QueryInvoiceDto } from './dto/query-invoice.dto';
import { QueryOverdueDto } from './dto/query-overdue.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';

@ApiTags('Invoices')
@Controller('invoices')
@UseGuards(ClerkAuthGuard, OrgMemberGuard)
@ApiBearerAuth()
export class InvoicesController {
  constructor(
    private readonly service: InvoicesService,
    private readonly reportService: InvoiceReportService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create an invoice' })
  async create(
    @CurrentOrg() orgId: string,
    @CurrentUser('id') userId: string,
    @Body() body: CreateInvoiceDto,
  ) {
    return this.service.create(orgId, userId, body);
  }

  @Get()
  @ApiOperation({ summary: 'List invoices' })
  async findAll(
    @CurrentOrg() orgId: string,
    @Query() query: QueryInvoiceDto,
  ) {
    return this.service.findAll(orgId, {
      jobId: query.jobId,
      status: query.status,
      page: query.page ?? 1,
      limit: query.limit ?? 20,
    });
  }

  @Get('aging')
  @ApiOperation({ summary: 'Get aging summary for overdue invoices' })
  async getAgingSummary(@CurrentOrg() orgId: string) {
    return this.service.getAgingSummary(orgId);
  }

  @Get('overdue')
  @ApiOperation({ summary: 'Get paginated list of overdue invoices' })
  async getOverdueInvoices(
    @CurrentOrg() orgId: string,
    @Query() query: QueryOverdueDto,
  ) {
    return this.service.getOverdueInvoices(orgId, {
      bucket: query.bucket,
      page: query.page ?? 1,
      limit: query.limit ?? 20,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get invoice detail' })
  async findOne(
    @CurrentOrg() orgId: string,
    @Param('id') id: string,
  ) {
    return this.service.findOne(orgId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an invoice' })
  async update(
    @CurrentOrg() orgId: string,
    @Param('id') id: string,
    @Body() body: UpdateInvoiceDto,
  ) {
    return this.service.update(orgId, id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an invoice' })
  async remove(
    @CurrentOrg() orgId: string,
    @Param('id') id: string,
  ) {
    return this.service.remove(orgId, id);
  }

  @Post(':id/payments')
  @ApiOperation({ summary: 'Record a payment on an invoice' })
  async addPayment(
    @CurrentOrg() orgId: string,
    @Param('id') id: string,
    @Body() body: CreatePaymentDto,
  ) {
    return this.service.addPayment(orgId, id, body);
  }

  @Get(':id/payments')
  @ApiOperation({ summary: 'List payments for an invoice' })
  async getPayments(
    @CurrentOrg() orgId: string,
    @Param('id') id: string,
  ) {
    return this.service.getPayments(orgId, id);
  }

  @Delete(':id/payments/:paymentId')
  @ApiOperation({ summary: 'Remove a payment from an invoice' })
  async removePayment(
    @CurrentOrg() orgId: string,
    @Param('id') id: string,
    @Param('paymentId') paymentId: string,
  ) {
    return this.service.removePayment(orgId, id, paymentId);
  }

  @Post(':id/remind')
  @ApiOperation({ summary: 'Send a payment reminder for an overdue invoice' })
  async sendReminder(
    @CurrentOrg() orgId: string,
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.service.sendReminder(orgId, id, userId);
  }

  @Post(':id/share-link')
  @ApiOperation({ summary: 'Generate a shareable public link for this invoice' })
  async generateShareLink(
    @CurrentOrg() orgId: string,
    @Param('id') id: string,
  ) {
    return this.service.generateShareLink(orgId, id);
  }

  @Get(':id/pdf')
  @ApiOperation({ summary: 'Generate invoice PDF' })
  async getPdf(
    @CurrentOrg() orgId: string,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const { buffer, filename } = await this.reportService.generateInvoicePdf(orgId, id);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }
}
