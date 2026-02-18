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
import { JobTemplatesService } from './job-templates.service';
import { CreateJobTemplateDto } from './dto/create-job-template.dto';
import { UpdateJobTemplateDto } from './dto/update-job-template.dto';
import { QueryJobTemplateDto } from './dto/query-job-template.dto';

@ApiTags('Job Templates')
@Controller('job-templates')
@UseGuards(ClerkAuthGuard, OrgMemberGuard)
@ApiBearerAuth()
export class JobTemplatesController {
  constructor(private readonly service: JobTemplatesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a job template' })
  async create(
    @CurrentOrg() orgId: string,
    @CurrentUser('id') userId: string,
    @Body() body: CreateJobTemplateDto,
  ) {
    return this.service.create(orgId, userId, body);
  }

  @Get()
  @ApiOperation({ summary: 'List job templates' })
  async findAll(
    @CurrentOrg() orgId: string,
    @Query() query: QueryJobTemplateDto,
  ) {
    return this.service.findAll(orgId, {
      page: query.page ?? 1,
      limit: query.limit ?? 20,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get job template details' })
  async findOne(@CurrentOrg() orgId: string, @Param('id') id: string) {
    return this.service.findOne(orgId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a job template' })
  async update(
    @CurrentOrg() orgId: string,
    @Param('id') id: string,
    @Body() body: UpdateJobTemplateDto,
  ) {
    return this.service.update(orgId, id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a job template' })
  async remove(@CurrentOrg() orgId: string, @Param('id') id: string) {
    return this.service.remove(orgId, id);
  }

  @Post('from-job/:jobId')
  @ApiOperation({ summary: 'Create a template from an existing job' })
  async createFromJob(
    @CurrentOrg() orgId: string,
    @CurrentUser('id') userId: string,
    @Param('jobId') jobId: string,
    @Body('name') name: string,
  ) {
    return this.service.createFromJob(orgId, jobId, userId, name || 'Template from Job');
  }
}
