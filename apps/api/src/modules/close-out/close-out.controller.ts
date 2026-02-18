import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import { OrgMemberGuard } from '../../common/guards/org-member.guard';
import { CurrentOrg } from '../../common/decorators/current-org.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CloseOutService } from './close-out.service';
import { InitiateCloseOutDto } from './dto/initiate-close-out.dto';
import { UpdateChecklistItemDto } from './dto/update-checklist-item.dto';
import { UpdateCloseOutDto } from './dto/update-close-out.dto';

@ApiTags('Close-out')
@Controller('close-out')
@UseGuards(ClerkAuthGuard, OrgMemberGuard)
@ApiBearerAuth()
export class CloseOutController {
  constructor(private readonly closeOutService: CloseOutService) {}

  @Post('initiate')
  @ApiOperation({ summary: 'Initiate a job close-out' })
  async initiate(
    @CurrentOrg() orgId: string,
    @CurrentUser('id') userId: string,
    @Body() body: InitiateCloseOutDto,
  ) {
    return this.closeOutService.initiate(
      orgId,
      userId,
      body.jobId,
      body.customItems,
    );
  }

  @Get('job/:jobId')
  @ApiOperation({ summary: 'Get close-out for a job' })
  async getByJob(
    @CurrentOrg() orgId: string,
    @Param('jobId') jobId: string,
  ) {
    return this.closeOutService.getByJob(orgId, jobId);
  }

  @Get('job/:jobId/progress')
  @ApiOperation({ summary: 'Get close-out progress for a job' })
  async getProgress(
    @CurrentOrg() orgId: string,
    @Param('jobId') jobId: string,
  ) {
    return this.closeOutService.getProgress(orgId, jobId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update close-out details' })
  async updateCloseOut(
    @CurrentOrg() orgId: string,
    @Param('id') id: string,
    @Body() body: UpdateCloseOutDto,
  ) {
    return this.closeOutService.updateCloseOut(orgId, id, body);
  }

  @Patch('checklist/:itemId')
  @ApiOperation({ summary: 'Update a checklist item status' })
  async updateChecklistItem(
    @CurrentOrg() orgId: string,
    @CurrentUser('id') userId: string,
    @Param('itemId') itemId: string,
    @Body() body: UpdateChecklistItemDto,
  ) {
    return this.closeOutService.updateChecklistItem(
      orgId,
      itemId,
      userId,
      body,
    );
  }

  @Post(':id/signature-upload-url')
  @ApiOperation({ summary: 'Get a presigned URL for signature upload' })
  async getSignatureUploadUrl(
    @CurrentOrg() orgId: string,
    @Param('id') id: string,
  ) {
    return this.closeOutService.getSignatureUploadUrl(orgId, id);
  }

  @Post(':id/signature')
  @ApiOperation({ summary: 'Save customer signature' })
  async saveSignature(
    @CurrentOrg() orgId: string,
    @Param('id') id: string,
    @Body() body: { signatureKey: string; customerName: string },
  ) {
    return this.closeOutService.saveSignature(
      orgId,
      id,
      body.signatureKey,
      body.customerName,
    );
  }

  @Post(':id/complete')
  @ApiOperation({ summary: 'Complete the job close-out' })
  async completeCloseOut(
    @CurrentOrg() orgId: string,
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.closeOutService.completeCloseOut(orgId, id, userId);
  }
}
