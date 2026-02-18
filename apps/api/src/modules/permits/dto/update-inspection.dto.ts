import { IsString, IsOptional, IsDateString, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { InspectionResult } from '@prisma/client';

export class UpdateInspectionDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  completedDate?: string;

  @ApiPropertyOptional({ enum: InspectionResult })
  @IsOptional()
  @IsEnum(InspectionResult)
  result?: InspectionResult;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  inspector?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
