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
import { DocumentsService } from './documents.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { QueryDocumentDto } from './dto/query-document.dto';

@ApiTags('Documents')
@Controller('documents')
@UseGuards(ClerkAuthGuard, OrgMemberGuard)
@ApiBearerAuth()
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post('upload-url')
  @ApiOperation({ summary: 'Generate a pre-signed S3 upload URL' })
  async getUploadUrl(
    @CurrentOrg() orgId: string,
    @Body() body: { fileName: string; contentType: string },
  ) {
    return this.documentsService.generateUploadUrl(orgId, body.fileName, body.contentType);
  }

  @Post()
  @ApiOperation({ summary: 'Create a document record after uploading to S3' })
  async create(
    @CurrentOrg() orgId: string,
    @CurrentUser('id') userId: string,
    @Body() body: CreateDocumentDto,
  ) {
    return this.documentsService.create(orgId, userId, body);
  }

  @Get()
  @ApiOperation({ summary: 'List documents with filters' })
  async findAll(
    @CurrentOrg() orgId: string,
    @Query() query: QueryDocumentDto,
  ) {
    return this.documentsService.findAll(orgId, {
      type: query.type,
      jobId: query.jobId,
      vendorId: query.vendorId,
      subcontractorId: query.subcontractorId,
      search: query.search,
      page: query.page ?? 1,
      limit: query.limit ?? 20,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get document details with download URL' })
  async findOne(
    @CurrentOrg() orgId: string,
    @Param('id') id: string,
  ) {
    return this.documentsService.findOne(orgId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update document metadata' })
  async update(
    @CurrentOrg() orgId: string,
    @Param('id') id: string,
    @Body() body: UpdateDocumentDto,
  ) {
    return this.documentsService.update(orgId, id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a document (S3 + DB)' })
  async remove(
    @CurrentOrg() orgId: string,
    @Param('id') id: string,
  ) {
    return this.documentsService.remove(orgId, id);
  }
}
