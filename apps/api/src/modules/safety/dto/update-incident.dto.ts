import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  MinLength,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IncidentType,
  IncidentSeverity,
  IncidentStatus,
} from '@prisma/client';

export class UpdateIncidentDto {
  @ApiPropertyOptional({ enum: IncidentType })
  @IsOptional()
  @IsEnum(IncidentType)
  type?: IncidentType;

  @ApiPropertyOptional({ enum: IncidentSeverity })
  @IsOptional()
  @IsEnum(IncidentSeverity)
  severity?: IncidentSeverity;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  witnesses?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  actionTaken?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  followUp?: string;

  @ApiPropertyOptional({ enum: IncidentStatus })
  @IsOptional()
  @IsEnum(IncidentStatus)
  status?: IncidentStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  resolvedAt?: string;
}
