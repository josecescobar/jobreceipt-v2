import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser, type RequestUser } from '../common/decorators/current-user.decorator';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { InviteMemberDto } from './dto/invite-member.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { OrganizationsService } from './organizations.service';

@ApiTags('organizations')
@ApiBearerAuth()
@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Post()
  createOrganization(@CurrentUser() user: RequestUser, @Body() dto: CreateOrganizationDto) {
    return this.organizationsService.createOrganization(user, dto);
  }

  @Get('current')
  getCurrent() {
    return this.organizationsService.getCurrent();
  }

  @Patch(':id')
  updateOrganization(
    @Param('id') id: string,
    @CurrentUser() user: RequestUser,
    @Body() dto: UpdateOrganizationDto,
  ) {
    return this.organizationsService.updateOrganization(id, user, dto);
  }

  @Post(':id/members/invite')
  inviteMember(
    @Param('id') organizationId: string,
    @CurrentUser() user: RequestUser,
    @Body() dto: InviteMemberDto,
  ) {
    return this.organizationsService.inviteMember(organizationId, user, dto);
  }
}
