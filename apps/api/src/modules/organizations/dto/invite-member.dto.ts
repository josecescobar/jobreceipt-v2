import { IsEmail, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

enum UserRole {
  OWNER = 'OWNER',
  BOOKKEEPER = 'BOOKKEEPER',
  CREW = 'CREW',
}

export class InviteMemberDto {
  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ enum: UserRole, default: UserRole.CREW })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole = UserRole.CREW;
}
