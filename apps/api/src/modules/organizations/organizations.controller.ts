import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
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
import { CreateOrgDto } from './dto/create-org.dto';
import { UpdateOrgDto } from './dto/update-org.dto';
import { InviteMemberDto } from './dto/invite-member.dto';

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
    @Body() body: CreateOrgDto,
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
    @Body() body: UpdateOrgDto,
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
    @Body() body: InviteMemberDto,
  ) {
    return this.organizationsService.inviteMember(orgId, body.email, body.role ?? 'CREW');
  }

  @Get(':organizationId/members')
  @UseGuards(ClerkAuthGuard, OrgMemberGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List organization members' })
  async listMembers(@Param('organizationId') orgId: string) {
    return this.organizationsService.listMembers(orgId);
  }

  @Patch(':organizationId/members/:memberId')
  @UseGuards(ClerkAuthGuard, OrgMemberGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a member\'s role' })
  async updateMemberRole(
    @Param('organizationId') orgId: string,
    @Param('memberId') memberId: string,
    @Body() body: { role: 'BOOKKEEPER' | 'CREW' },
  ) {
    return this.organizationsService.updateMemberRole(orgId, memberId, body.role);
  }

  @Delete(':organizationId/members/:memberId')
  @UseGuards(ClerkAuthGuard, OrgMemberGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove a member from the organization' })
  async removeMember(
    @Param('organizationId') orgId: string,
    @Param('memberId') memberId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.organizationsService.removeMember(orgId, memberId, userId);
  }
}
