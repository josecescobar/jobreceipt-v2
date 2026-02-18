import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  Req,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import { OrgMemberGuard } from '../../common/guards/org-member.guard';
import { CurrentOrg } from '../../common/decorators/current-org.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { QueryExpenseDto } from './dto/query-expense.dto';
import {
  BatchCreateExpensesDto,
  BatchDeleteExpensesDto,
  BatchUpdateExpensesDto,
  BatchApproveExpensesDto,
  BatchRejectExpensesDto,
} from './dto/batch-expense.dto';

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
    @Body() body: CreateExpenseDto,
  ) {
    return this.expensesService.create(orgId, userId, body);
  }

  @Get()
  @ApiOperation({ summary: 'List expenses with filters' })
  async findAll(
    @CurrentOrg() orgId: string,
    @Query() query: QueryExpenseDto,
  ) {
    return this.expensesService.findAll(orgId, {
      jobId: query.jobId,
      category: query.category,
      taxCategory: query.taxCategory,
      status: query.status,
      startDate: query.startDate,
      endDate: query.endDate,
      search: query.search,
      page: query.page ?? 1,
      limit: query.limit ?? 20,
    });
  }

  @Post('batch')
  @ApiOperation({ summary: 'Create multiple expenses at once (e.g. split receipt across jobs)' })
  async createBatch(
    @CurrentOrg() orgId: string,
    @CurrentUser('id') userId: string,
    @Body() body: BatchCreateExpensesDto,
  ) {
    return this.expensesService.createBatch(orgId, userId, body.items);
  }

  @Post('upload-url')
  @ApiOperation({ summary: 'Get a presigned URL for expense photo upload' })
  async getUploadUrl(
    @CurrentOrg() orgId: string,
    @Body() body: { fileName: string; contentType: string },
  ) {
    return this.expensesService.requestUploadUrl(orgId, body.fileName, body.contentType);
  }

  @Post('batch/delete')
  @ApiOperation({ summary: 'Batch delete expenses' })
  async batchDelete(
    @CurrentOrg() orgId: string,
    @Body() body: BatchDeleteExpensesDto,
  ) {
    return this.expensesService.batchDelete(orgId, body.ids);
  }

  @Patch('batch/update')
  @ApiOperation({ summary: 'Batch update expenses' })
  async batchUpdate(
    @CurrentOrg() orgId: string,
    @Body() body: BatchUpdateExpensesDto,
  ) {
    return this.expensesService.batchUpdate(orgId, body.ids, {
      jobId: body.jobId,
      category: body.category,
    });
  }

  @Post('batch/approve')
  @ApiOperation({ summary: 'Batch approve expenses' })
  async batchApprove(
    @CurrentOrg() orgId: string,
    @CurrentUser('id') userId: string,
    @Body() body: BatchApproveExpensesDto,
    @Req() req: any,
  ) {
    if (req.userRole !== 'OWNER' && req.userRole !== 'BOOKKEEPER') {
      throw new ForbiddenException('Only owners and bookkeepers can approve expenses');
    }
    return this.expensesService.batchApprove(orgId, body.ids, userId);
  }

  @Post('batch/reject')
  @ApiOperation({ summary: 'Batch reject expenses' })
  async batchReject(
    @CurrentOrg() orgId: string,
    @Body() body: BatchRejectExpensesDto,
    @Req() req: any,
  ) {
    if (req.userRole !== 'OWNER' && req.userRole !== 'BOOKKEEPER') {
      throw new ForbiddenException('Only owners and bookkeepers can reject expenses');
    }
    return this.expensesService.batchReject(orgId, body.ids);
  }

  @Post(':id/approve')
  @ApiOperation({ summary: 'Approve an expense' })
  async approve(
    @CurrentOrg() orgId: string,
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Req() req: any,
  ) {
    if (req.userRole !== 'OWNER' && req.userRole !== 'BOOKKEEPER') {
      throw new ForbiddenException('Only owners and bookkeepers can approve expenses');
    }
    return this.expensesService.approve(orgId, id, userId);
  }

  @Post(':id/reject')
  @ApiOperation({ summary: 'Reject an expense' })
  async reject(
    @CurrentOrg() orgId: string,
    @Param('id') id: string,
    @Req() req: any,
  ) {
    if (req.userRole !== 'OWNER' && req.userRole !== 'BOOKKEEPER') {
      throw new ForbiddenException('Only owners and bookkeepers can reject expenses');
    }
    return this.expensesService.reject(orgId, id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get expense details' })
  async findOne(@CurrentOrg() orgId: string, @Param('id') id: string) {
    const expense = await this.expensesService.findOne(orgId, id);
    if (expense.imageKey) {
      const imageUrl = await this.expensesService.getImageUrl(expense.imageKey);
      return { ...expense, imageUrl };
    }
    return expense;
  }

  @Get(':id/image-url')
  @ApiOperation({ summary: 'Get presigned download URL for expense photo' })
  async getImageDownloadUrl(@CurrentOrg() orgId: string, @Param('id') id: string) {
    const expense = await this.expensesService.findOne(orgId, id);
    if (!expense.imageKey) return { imageUrl: null };
    const imageUrl = await this.expensesService.getImageUrl(expense.imageKey);
    return { imageUrl };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an expense' })
  async update(
    @CurrentOrg() orgId: string,
    @Param('id') id: string,
    @Body() body: UpdateExpenseDto,
  ) {
    return this.expensesService.update(orgId, id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an expense' })
  async remove(@CurrentOrg() orgId: string, @Param('id') id: string) {
    return this.expensesService.remove(orgId, id);
  }
}
