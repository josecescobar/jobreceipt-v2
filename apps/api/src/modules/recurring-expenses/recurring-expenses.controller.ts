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
import { RecurringExpensesService } from './recurring-expenses.service';
import { CreateRecurringExpenseDto } from './dto/create-recurring-expense.dto';
import { UpdateRecurringExpenseDto } from './dto/update-recurring-expense.dto';
import { QueryRecurringExpenseDto } from './dto/query-recurring-expense.dto';

@ApiTags('Recurring Expenses')
@Controller('recurring-expenses')
@UseGuards(ClerkAuthGuard, OrgMemberGuard)
@ApiBearerAuth()
export class RecurringExpensesController {
  constructor(private readonly service: RecurringExpensesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a recurring expense' })
  async create(
    @CurrentOrg() orgId: string,
    @CurrentUser('id') userId: string,
    @Body() body: CreateRecurringExpenseDto,
  ) {
    return this.service.create(orgId, userId, body);
  }

  @Get()
  @ApiOperation({ summary: 'List recurring expenses' })
  async findAll(
    @CurrentOrg() orgId: string,
    @Query() query: QueryRecurringExpenseDto,
  ) {
    return this.service.findAll(orgId, {
      isActive: query.isActive,
      jobId: query.jobId,
      page: query.page ?? 1,
      limit: query.limit ?? 20,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get recurring expense details' })
  async findOne(@CurrentOrg() orgId: string, @Param('id') id: string) {
    return this.service.findOne(orgId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a recurring expense' })
  async update(
    @CurrentOrg() orgId: string,
    @Param('id') id: string,
    @Body() body: UpdateRecurringExpenseDto,
  ) {
    return this.service.update(orgId, id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a recurring expense' })
  async remove(@CurrentOrg() orgId: string, @Param('id') id: string) {
    return this.service.remove(orgId, id);
  }
}
