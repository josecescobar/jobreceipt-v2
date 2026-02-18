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
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import { OrgMemberGuard } from '../../common/guards/org-member.guard';
import { CurrentOrg } from '../../common/decorators/current-org.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { QueryCustomerDto } from './dto/query-customer.dto';

@ApiTags('Customers')
@Controller('customers')
@UseGuards(ClerkAuthGuard, OrgMemberGuard)
@ApiBearerAuth()
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a customer' })
  async create(
    @CurrentOrg() orgId: string,
    @CurrentUser('id') userId: string,
    @Body() body: CreateCustomerDto,
  ) {
    return this.customersService.create(orgId, userId, body);
  }

  @Get()
  @ApiOperation({ summary: 'List customers for the organization' })
  async findAll(
    @CurrentOrg() orgId: string,
    @Query() query: QueryCustomerDto,
  ) {
    return this.customersService.findAll(orgId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a customer by ID' })
  async findOne(@CurrentOrg() orgId: string, @Param('id') id: string) {
    return this.customersService.findOne(orgId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a customer' })
  async update(
    @CurrentOrg() orgId: string,
    @Param('id') id: string,
    @Body() body: UpdateCustomerDto,
  ) {
    return this.customersService.update(orgId, id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a customer' })
  async remove(@CurrentOrg() orgId: string, @Param('id') id: string) {
    return this.customersService.remove(orgId, id);
  }

  @Get(':id/jobs')
  @ApiOperation({ summary: 'Get jobs for a customer' })
  async getJobs(
    @CurrentOrg() orgId: string,
    @Param('id') id: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.customersService.getJobs(orgId, id, page, limit);
  }
}
