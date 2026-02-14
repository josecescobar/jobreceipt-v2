import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import { OrgMemberGuard } from '../../common/guards/org-member.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { OrganizationsService } from './organizations.service';

@ApiTags('Organizations')
@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Post()
  @UseGuards(ClerkAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new organization' })
  @ApiResponse({ status: 201, description: 'Organization created' })
  async create(
    @CurrentUser('id') userId: string,
    @Body() body: { name: string; slug: string },
  ) {
    return this.organizationsService.create(userId, body);
  }

  @Get(':organizationId')
  @UseGuards(ClerkAuthGuard, OrgMemberGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get organization details' })
  async findOne(@Param('organizationId') id: string) {
    return this.organizationsService.findOne(id);
  }

  @Patch(':organizationId')
  @UseGuards(ClerkAuthGuard, OrgMemberGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update organization' })
  async update(
    @Param('organizationId') id: string,
    @Body() body: { name?: string; slug?: string },
  ) {
    return this.organizationsService.update(id, body);
  }

  @Post(':organizationId/members/invite')
  @UseGuards(ClerkAuthGuard, OrgMemberGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Invite a member to the organization' })
  async inviteMember(
    @Param('organizationId') orgId: string,
    @Body() body: { email: string; role: 'OWNER' | 'BOOKKEEPER' | 'CREW' },
  ) {
    return this.organizationsService.inviteMember(orgId, body.email, body.role);
  }

  @Get(':organizationId/members')
  @UseGuards(ClerkAuthGuard, OrgMemberGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List organization members' })
  async listMembers(@Param('organizationId') orgId: string) {
    return this.organizationsService.listMembers(orgId);
  }
}
