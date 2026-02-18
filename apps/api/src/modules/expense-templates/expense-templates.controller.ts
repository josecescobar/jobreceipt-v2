import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import { OrgMemberGuard } from '../../common/guards/org-member.guard';
import { CurrentOrg } from '../../common/decorators/current-org.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ExpenseTemplatesService } from './expense-templates.service';
import { CreateExpenseTemplateDto } from './dto/create-expense-template.dto';
import { UpdateExpenseTemplateDto } from './dto/update-expense-template.dto';
import { QueryExpenseTemplateDto } from './dto/query-expense-template.dto';
import { SaveExpenseAsTemplateDto } from './dto/save-expense-as-template.dto';

@ApiTags('Expense Templates')
@Controller('expense-templates')
@UseGuards(ClerkAuthGuard, OrgMemberGuard)
@ApiBearerAuth()
export class ExpenseTemplatesController {
  constructor(private readonly service: ExpenseTemplatesService) {}

  @Post()
  @ApiOperation({ summary: 'Create an expense template' })
  async create(
    @CurrentOrg() orgId: string,
    @CurrentUser('id') userId: string,
    @Body() body: CreateExpenseTemplateDto,
  ) {
    return this.service.create(orgId, userId, body);
  }

  @Post('from-expense')
  @ApiOperation({ summary: 'Save an existing expense as a template' })
  async saveFromExpense(
    @CurrentOrg() orgId: string,
    @CurrentUser('id') userId: string,
    @Body() body: SaveExpenseAsTemplateDto,
  ) {
    return this.service.saveFromExpense(orgId, userId, body.name, body.expenseId);
  }

  @Get()
  @ApiOperation({ summary: 'List expense templates' })
  async findAll(
    @CurrentOrg() orgId: string,
    @Query() query: QueryExpenseTemplateDto,
  ) {
    return this.service.findAll(orgId, {
      search: query.search,
      page: query.page ?? 1,
      limit: query.limit ?? 20,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get expense template detail' })
  async findOne(
    @CurrentOrg() orgId: string,
    @Param('id') id: string,
  ) {
    return this.service.findOne(orgId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an expense template' })
  async update(
    @CurrentOrg() orgId: string,
    @Param('id') id: string,
    @Body() body: UpdateExpenseTemplateDto,
  ) {
    return this.service.update(orgId, id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an expense template' })
  async remove(
    @CurrentOrg() orgId: string,
    @Param('id') id: string,
  ) {
    return this.service.remove(orgId, id);
  }
}
