import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import { OrgMemberGuard } from '../../common/guards/org-member.guard';
import { CurrentOrg } from '../../common/decorators/current-org.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ChangeOrdersService } from './change-orders.service';
import { CreateChangeOrderDto } from './dto/create-change-order.dto';
import { UpdateChangeOrderDto } from './dto/update-change-order.dto';
import { QueryChangeOrderDto } from './dto/query-change-order.dto';

@ApiTags('Change Orders')
@Controller('change-orders')
@UseGuards(ClerkAuthGuard, OrgMemberGuard)
@ApiBearerAuth()
export class ChangeOrdersController {
  constructor(private readonly service: ChangeOrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a change order' })
  async create(
    @CurrentOrg() orgId: string,
    @CurrentUser('id') userId: string,
    @Body() body: CreateChangeOrderDto,
  ) {
    return this.service.create(orgId, userId, body);
  }

  @Get()
  @ApiOperation({ summary: 'List change orders (optionally filtered by job)' })
  async findAll(
    @CurrentOrg() orgId: string,
    @Query() query: QueryChangeOrderDto,
  ) {
    return this.service.findAll(orgId, {
      jobId: query.jobId,
      status: query.status,
      page: query.page ?? 1,
      limit: query.limit ?? 20,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get change order detail' })
  async findOne(
    @CurrentOrg() orgId: string,
    @Param('id') id: string,
  ) {
    return this.service.findOne(orgId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a change order (DRAFT only for edits)' })
  async update(
    @CurrentOrg() orgId: string,
    @Param('id') id: string,
    @Body() body: UpdateChangeOrderDto,
  ) {
    return this.service.update(orgId, id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a change order (DRAFT only)' })
  async remove(
    @CurrentOrg() orgId: string,
    @Param('id') id: string,
  ) {
    return this.service.remove(orgId, id);
  }

  @Post(':id/approve')
  @ApiOperation({ summary: 'Approve a submitted change order (OWNER/BOOKKEEPER only)' })
  async approve(
    @CurrentOrg() orgId: string,
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Req() req: any,
  ) {
    if (req.userRole !== 'OWNER' && req.userRole !== 'BOOKKEEPER') {
      throw new ForbiddenException('Only owners and bookkeepers can approve change orders');
    }
    return this.service.approve(orgId, id, userId);
  }

  @Post(':id/reject')
  @ApiOperation({ summary: 'Reject a submitted change order (OWNER/BOOKKEEPER only)' })
  async reject(
    @CurrentOrg() orgId: string,
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Req() req: any,
  ) {
    if (req.userRole !== 'OWNER' && req.userRole !== 'BOOKKEEPER') {
      throw new ForbiddenException('Only owners and bookkeepers can reject change orders');
    }
    return this.service.reject(orgId, id, userId);
  }
}
