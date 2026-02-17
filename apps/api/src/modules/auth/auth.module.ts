import { Module, forwardRef } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import { OrgMemberGuard } from '../../common/guards/org-member.guard';
import { OrganizationsModule } from '../organizations/organizations.module';

@Module({
  imports: [forwardRef(() => OrganizationsModule)],
  controllers: [AuthController],
  providers: [AuthService, ClerkAuthGuard, OrgMemberGuard],
  exports: [AuthService, ClerkAuthGuard, OrgMemberGuard],
})
export class AuthModule {}
