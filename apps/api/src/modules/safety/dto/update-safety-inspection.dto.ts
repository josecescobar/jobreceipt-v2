import {
  IsString,
  IsOptional,
  IsBoolean,
  IsArray,
  ValidateNested,
  IsEnum,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { SafetyInspectionStatus } from '@prisma/client';

class InspectionItemUpdateDto {
  @IsString()
  id: string;

  @IsBoolean()
  isCompliant: boolean;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateSafetyInspectionDto {
  @ApiPropertyOptional({ type: [InspectionItemUpdateDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InspectionItemUpdateDto)
  items?: InspectionItemUpdateDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ enum: SafetyInspectionStatus })
  @IsOptional()
  @IsEnum(SafetyInspectionStatus)
  status?: SafetyInspectionStatus;
}
