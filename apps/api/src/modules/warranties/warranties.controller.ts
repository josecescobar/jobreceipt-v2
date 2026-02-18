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
import { WarrantiesService } from './warranties.service';
import { CreateWarrantyDto } from './dto/create-warranty.dto';
import { UpdateWarrantyDto } from './dto/update-warranty.dto';
import { QueryWarrantyDto } from './dto/query-warranty.dto';
import { CreateWarrantyClaimDto } from './dto/create-warranty-claim.dto';

@ApiTags('warranties')
@Controller('warranties')
@UseGuards(ClerkAuthGuard, OrgMemberGuard)
@ApiBearerAuth()
export class WarrantiesController {
  constructor(private readonly warrantiesService: WarrantiesService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Get warranty summary counts' })
  async getSummary(@CurrentOrg() orgId: string) {
    return this.warrantiesService.getSummary(orgId);
  }

  @Get('upcoming-expirations')
  @ApiOperation({ summary: 'Get warranties expiring within 90 days' })
  async getUpcomingExpirations(@CurrentOrg() orgId: string) {
    return this.warrantiesService.getUpcomingExpirations(orgId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a warranty' })
  async create(
    @CurrentOrg() orgId: string,
    @CurrentUser('id') userId: string,
    @Body() body: CreateWarrantyDto,
  ) {
    return this.warrantiesService.create(orgId, userId, body);
  }

  @Get()
  @ApiOperation({ summary: 'List warranties' })
  async findAll(
    @CurrentOrg() orgId: string,
    @Query() query: QueryWarrantyDto,
  ) {
    return this.warrantiesService.findAll(orgId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get warranty details' })
  async findOne(@CurrentOrg() orgId: string, @Param('id') id: string) {
    return this.warrantiesService.findOne(orgId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a warranty' })
  async update(
    @CurrentOrg() orgId: string,
    @Param('id') id: string,
    @Body() body: UpdateWarrantyDto,
  ) {
    return this.warrantiesService.update(orgId, id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a warranty' })
  async remove(@CurrentOrg() orgId: string, @Param('id') id: string) {
    return this.warrantiesService.remove(orgId, id);
  }

  @Post(':id/claims')
  @ApiOperation({ summary: 'Add a claim to a warranty' })
  async addClaim(
    @CurrentOrg() orgId: string,
    @CurrentUser('id') userId: string,
    @Param('id') warrantyId: string,
    @Body() body: CreateWarrantyClaimDto,
  ) {
    return this.warrantiesService.addClaim(orgId, userId, warrantyId, body);
  }
}
