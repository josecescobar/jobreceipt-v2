import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser, type RequestUser } from '../common/decorators/current-user.decorator';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { ListExpensesDto } from './dto/list-expenses.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { ExpensesService } from './expenses.service';

@ApiTags('expenses')
@ApiBearerAuth()
@Controller('expenses')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Post()
  create(@CurrentUser() user: RequestUser, @Body() dto: CreateExpenseDto) {
    return this.expensesService.create(user, dto);
  }

  @Get()
  list(@Query() query: ListExpensesDto) {
    return this.expensesService.list(query);
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.expensesService.getById(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateExpenseDto) {
    return this.expensesService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.expensesService.remove(id);
  }
}
