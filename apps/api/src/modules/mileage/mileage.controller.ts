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
import { MileageService } from './mileage.service';
import { CreateMileageDto } from './dto/create-mileage.dto';
import { UpdateMileageDto } from './dto/update-mileage.dto';

@ApiTags('Mileage')
@Controller('mileage')
@UseGuards(ClerkAuthGuard, OrgMemberGuard)
@ApiBearerAuth()
export class MileageController {
  constructor(private readonly mileageService: MileageService) {}

  @Post()
  @ApiOperation({ summary: 'Create a mileage trip' })
  async create(
    @CurrentOrg() orgId: string,
    @CurrentUser('id') userId: string,
    @Body() body: CreateMileageDto,
  ) {
    return this.mileageService.create(orgId, userId, body);
  }

  @Get()
  @ApiOperation({ summary: 'List mileage trips with filters' })
  @ApiQuery({ name: 'jobId', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async findAll(
    @CurrentOrg() orgId: string,
    @Query('jobId') jobId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.mileageService.findAll(orgId, {
      jobId,
      startDate,
      endDate,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
    });
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get mileage summary stats' })
  @ApiQuery({ name: 'jobId', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  async getSummary(
    @CurrentOrg() orgId: string,
    @Query('jobId') jobId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.mileageService.getSummary(orgId, { jobId, startDate, endDate });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get mileage trip details' })
  async findOne(@CurrentOrg() orgId: string, @Param('id') id: string) {
    return this.mileageService.findOne(orgId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a mileage trip' })
  async update(
    @CurrentOrg() orgId: string,
    @Param('id') id: string,
    @Body() body: UpdateMileageDto,
  ) {
    return this.mileageService.update(orgId, id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a mileage trip' })
  async remove(@CurrentOrg() orgId: string, @Param('id') id: string) {
    return this.mileageService.remove(orgId, id);
  }
}
