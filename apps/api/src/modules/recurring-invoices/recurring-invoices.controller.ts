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
import { RecurringInvoicesService } from './recurring-invoices.service';
import { CreateRecurringInvoiceDto } from './dto/create-recurring-invoice.dto';
import { UpdateRecurringInvoiceDto } from './dto/update-recurring-invoice.dto';
import { QueryRecurringInvoiceDto } from './dto/query-recurring-invoice.dto';

@ApiTags('Recurring Invoices')
@Controller('recurring-invoices')
@UseGuards(ClerkAuthGuard, OrgMemberGuard)
@ApiBearerAuth()
export class RecurringInvoicesController {
  constructor(private readonly service: RecurringInvoicesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a recurring invoice' })
  async create(
    @CurrentOrg() orgId: string,
    @CurrentUser('id') userId: string,
    @Body() body: CreateRecurringInvoiceDto,
  ) {
    return this.service.create(orgId, userId, body);
  }

  @Get()
  @ApiOperation({ summary: 'List recurring invoices' })
  async findAll(
    @CurrentOrg() orgId: string,
    @Query() query: QueryRecurringInvoiceDto,
  ) {
    return this.service.findAll(orgId, {
      isActive: query.isActive,
      jobId: query.jobId,
      page: query.page ?? 1,
      limit: query.limit ?? 20,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get recurring invoice details' })
  async findOne(@CurrentOrg() orgId: string, @Param('id') id: string) {
    return this.service.findOne(orgId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a recurring invoice' })
  async update(
    @CurrentOrg() orgId: string,
    @Param('id') id: string,
    @Body() body: UpdateRecurringInvoiceDto,
  ) {
    return this.service.update(orgId, id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a recurring invoice' })
  async remove(@CurrentOrg() orgId: string, @Param('id') id: string) {
    return this.service.remove(orgId, id);
  }
}
