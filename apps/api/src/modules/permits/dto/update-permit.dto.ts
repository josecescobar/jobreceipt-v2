import { PartialType } from '@nestjs/swagger';
import { IsOptional, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CreatePermitDto } from './create-permit.dto';
import { PermitStatus } from '@prisma/client';

export class UpdatePermitDto extends PartialType(CreatePermitDto) {
  @ApiPropertyOptional({ enum: PermitStatus })
  @IsOptional()
  @IsEnum(PermitStatus)
  status?: PermitStatus;
}
