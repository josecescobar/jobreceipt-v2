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
import { ReceiptsService } from './receipts.service';
import { RequestUploadDto } from './dto/request-upload.dto';
import { ConfirmUploadDto } from './dto/confirm-upload.dto';
import { UpdateReceiptDto } from './dto/update-receipt.dto';
import { QueryReceiptDto } from './dto/query-receipt.dto';
import { SplitLineItemsDto } from './dto/split-line-items.dto';
import { CreateLineItemDto, UpdateLineItemDto } from './dto/line-item.dto';

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
    @Body() body: RequestUploadDto,
  ) {
    return this.receiptsService.requestUploadUrl(orgId, body.fileName, body.contentType);
  }

  @Post('upload/confirm')
  @ApiOperation({ summary: 'Confirm upload and start OCR processing' })
  async confirmUpload(
    @CurrentOrg() orgId: string,
    @CurrentUser('id') userId: string,
    @Body() body: ConfirmUploadDto,
  ) {
    return this.receiptsService.confirmUpload(orgId, userId, body.receiptId, body.imageKey);
  }

  @Get()
  @ApiOperation({ summary: 'List receipts with filters' })
  async findAll(
    @CurrentOrg() orgId: string,
    @Query() query: QueryReceiptDto,
  ) {
    return this.receiptsService.findAll(orgId, {
      status: query.status,
      jobId: query.jobId,
      merchantName: query.merchantName,
      startDate: query.startDate,
      endDate: query.endDate,
      page: query.page ?? 1,
      limit: query.limit ?? 20,
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
    @Body() body: UpdateReceiptDto,
  ) {
    return this.receiptsService.update(orgId, id, body);
  }

  @Patch(':id/split')
  @ApiOperation({ summary: 'Split line items across multiple jobs' })
  async splitLineItems(
    @CurrentOrg() orgId: string,
    @Param('id') id: string,
    @Body() body: SplitLineItemsDto,
  ) {
    return this.receiptsService.splitLineItems(orgId, id, body.assignments);
  }

  @Post(':id/line-items')
  @ApiOperation({ summary: 'Add a line item to a receipt' })
  async createLineItem(
    @CurrentOrg() orgId: string,
    @Param('id') id: string,
    @Body() body: CreateLineItemDto,
  ) {
    return this.receiptsService.createLineItem(orgId, id, body);
  }

  @Patch(':id/line-items/:lineItemId')
  @ApiOperation({ summary: 'Update a receipt line item' })
  async updateLineItem(
    @CurrentOrg() orgId: string,
    @Param('id') id: string,
    @Param('lineItemId') lineItemId: string,
    @Body() body: UpdateLineItemDto,
  ) {
    return this.receiptsService.updateLineItem(orgId, id, lineItemId, body);
  }

  @Delete(':id/line-items/:lineItemId')
  @ApiOperation({ summary: 'Delete a receipt line item' })
  async removeLineItem(
    @CurrentOrg() orgId: string,
    @Param('id') id: string,
    @Param('lineItemId') lineItemId: string,
  ) {
    return this.receiptsService.removeLineItem(orgId, id, lineItemId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete receipt and S3 image' })
  async remove(@CurrentOrg() orgId: string, @Param('id') id: string) {
    return this.receiptsService.remove(orgId, id);
  }
}
