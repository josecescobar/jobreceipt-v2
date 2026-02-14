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
import { ReceiptsService } from './receipts.service';

@ApiTags('Receipts')
@Controller('receipts')
@UseGuards(ClerkAuthGuard, OrgMemberGuard)
@ApiBearerAuth()
export class ReceiptsController {
  constructor(private readonly receiptsService: ReceiptsService) {}

  @Post('upload')
  @ApiOperation({ summary: 'Request a pre-signed upload URL and create receipt' })
  async requestUpload(
    @CurrentOrg() orgId: string,
    @Body() body: { fileName: string; contentType: string },
  ) {
    return this.receiptsService.requestUploadUrl(orgId, body.fileName, body.contentType);
  }

  @Post('upload/confirm')
  @ApiOperation({ summary: 'Confirm upload and start OCR processing' })
  async confirmUpload(
    @CurrentOrg() orgId: string,
    @CurrentUser('id') userId: string,
    @Body() body: { receiptId: string; imageKey: string },
  ) {
    return this.receiptsService.confirmUpload(orgId, userId, body.receiptId, body.imageKey);
  }

  @Get()
  @ApiOperation({ summary: 'List receipts with filters' })
  @ApiQuery({ name: 'status', required: false, enum: ['PROCESSING', 'REVIEW', 'APPROVED', 'REJECTED'] })
  @ApiQuery({ name: 'jobId', required: false })
  @ApiQuery({ name: 'merchantName', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async findAll(
    @CurrentOrg() orgId: string,
    @Query('status') status?: 'PROCESSING' | 'REVIEW' | 'APPROVED' | 'REJECTED',
    @Query('jobId') jobId?: string,
    @Query('merchantName') merchantName?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.receiptsService.findAll(orgId, {
      status,
      jobId,
      merchantName,
      startDate,
      endDate,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get receipt with OCR results and line items' })
  async findOne(@CurrentOrg() orgId: string, @Param('id') id: string) {
    return this.receiptsService.findOne(orgId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update receipt (assign to job, approve, edit OCR)' })
  async update(
    @CurrentOrg() orgId: string,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.receiptsService.update(orgId, id, body);
  }

  @Patch(':id/split')
  @ApiOperation({ summary: 'Split line items across multiple jobs' })
  async splitLineItems(
    @CurrentOrg() orgId: string,
    @Param('id') id: string,
    @Body() body: { assignments: Array<{ lineItemId: string; jobId: string }> },
  ) {
    return this.receiptsService.splitLineItems(orgId, id, body.assignments);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete receipt and S3 image' })
  async remove(@CurrentOrg() orgId: string, @Param('id') id: string) {
    return this.receiptsService.remove(orgId, id);
  }
}
