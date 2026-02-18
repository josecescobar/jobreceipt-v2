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
import { VendorsService } from './vendors.service';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { UpdateVendorDto } from './dto/update-vendor.dto';
import { QueryVendorDto } from './dto/query-vendor.dto';

@ApiTags('Vendors')
@Controller('vendors')
@UseGuards(ClerkAuthGuard, OrgMemberGuard)
@ApiBearerAuth()
export class VendorsController {
  constructor(private readonly vendorsService: VendorsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a vendor' })
  async create(
    @CurrentOrg() orgId: string,
    @CurrentUser('id') userId: string,
    @Body() body: CreateVendorDto,
  ) {
    return this.vendorsService.create(orgId, userId, body);
  }

  @Get()
  @ApiOperation({ summary: 'List vendors for the organization' })
  async findAll(
    @CurrentOrg() orgId: string,
    @Query() query: QueryVendorDto,
  ) {
    return this.vendorsService.findAll(orgId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a vendor by ID' })
  async findOne(@CurrentOrg() orgId: string, @Param('id') id: string) {
    return this.vendorsService.findOne(orgId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a vendor' })
  async update(
    @CurrentOrg() orgId: string,
    @Param('id') id: string,
    @Body() body: UpdateVendorDto,
  ) {
    return this.vendorsService.update(orgId, id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a vendor' })
  async remove(@CurrentOrg() orgId: string, @Param('id') id: string) {
    return this.vendorsService.remove(orgId, id);
  }

  @Get(':id/spending')
  @ApiOperation({ summary: 'Get spending summary for a vendor' })
  async getSpending(@CurrentOrg() orgId: string, @Param('id') id: string) {
    return this.vendorsService.getSpending(orgId, id);
  }
}
