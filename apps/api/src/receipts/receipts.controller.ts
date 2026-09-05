import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser, type RequestUser } from '../common/decorators/current-user.decorator';
import { BulkActionDto } from './dto/bulk-action.dto';
import { ListReceiptsDto } from './dto/list-receipts.dto';
import { PatchReceiptDto } from './dto/patch-receipt.dto';
import { SplitReceiptDto } from './dto/split-receipt.dto';
import { UploadReceiptDto } from './dto/upload-receipt.dto';
import { ReceiptsService } from './receipts.service';

@ApiTags('receipts')
@ApiBearerAuth()
@Controller('receipts')
export class ReceiptsController {
  constructor(private readonly receiptsService: ReceiptsService) {}

  @Post('bulk')
  bulkAction(@Body() dto: BulkActionDto) {
    return this.receiptsService.bulkAction(dto);
  }

  @Post('upload')
  @Throttle({ short: { limit: 2, ttl: 1000 }, medium: { limit: 10, ttl: 10000 } })
  upload(@CurrentUser() user: RequestUser, @Body() dto: UploadReceiptDto) {
    return this.receiptsService.upload(user, dto);
  }

  @Post(':id/process')
  @Throttle({ short: { limit: 1, ttl: 1000 }, medium: { limit: 5, ttl: 10000 } })
  process(@Param('id') id: string) {
    return this.receiptsService.process(id);
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.receiptsService.getById(id);
  }

  @Get()
  list(@Query() query: ListReceiptsDto) {
    return this.receiptsService.list(query);
  }

  @Patch(':id')
  patch(@Param('id') id: string, @CurrentUser() user: RequestUser, @Body() dto: PatchReceiptDto) {
    return this.receiptsService.patch(id, user, dto);
  }

  @Patch(':id/split')
  split(@Param('id') id: string, @CurrentUser() user: RequestUser, @Body() dto: SplitReceiptDto) {
    return this.receiptsService.split(id, user, dto);
  }
}
