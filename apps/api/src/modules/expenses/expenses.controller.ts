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
import { ExpensesService } from './expenses.service';

@ApiTags('Expenses')
@Controller('expenses')
@UseGuards(ClerkAuthGuard, OrgMemberGuard)
@ApiBearerAuth()
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a manual expense entry' })
  async create(
    @CurrentOrg() orgId: string,
    @CurrentUser('id') userId: string,
    @Body() body: {
      jobId: string;
      receiptId?: string;
      costCodeId?: string;
      amount: number;
      description: string;
      category?: string;
      taxCategory?: string;
      mileage?: number;
      date: string;
    },
  ) {
    return this.expensesService.create(orgId, userId, body);
  }

  @Get()
  @ApiOperation({ summary: 'List expenses with filters' })
  @ApiQuery({ name: 'jobId', required: false })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'taxCategory', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async findAll(
    @CurrentOrg() orgId: string,
    @Query('jobId') jobId?: string,
    @Query('category') category?: string,
    @Query('taxCategory') taxCategory?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.expensesService.findAll(orgId, {
      jobId,
      category,
      taxCategory,
      startDate,
      endDate,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get expense details' })
  async findOne(@CurrentOrg() orgId: string, @Param('id') id: string) {
    return this.expensesService.findOne(orgId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an expense' })
  async update(
    @CurrentOrg() orgId: string,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.expensesService.update(orgId, id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an expense' })
  async remove(@CurrentOrg() orgId: string, @Param('id') id: string) {
    return this.expensesService.remove(orgId, id);
  }
}
