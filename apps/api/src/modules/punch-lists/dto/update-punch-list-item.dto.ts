import { PartialType } from '@nestjs/swagger';
import { IsOptional, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PunchListItemStatus } from '@prisma/client';
import { CreatePunchListItemDto } from './create-punch-list-item.dto';

export class UpdatePunchListItemDto extends PartialType(CreatePunchListItemDto) {
  @ApiPropertyOptional({ enum: PunchListItemStatus })
  @IsOptional()
  @IsEnum(PunchListItemStatus)
  status?: PunchListItemStatus;
}
