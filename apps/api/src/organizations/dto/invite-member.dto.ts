import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { IsEmail, IsEnum } from 'class-validator';

export class InviteMemberDto {
  @ApiProperty({ example: 'crew.member@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ enum: UserRole, example: UserRole.CREW })
  @IsEnum(UserRole)
  role!: UserRole;
}
