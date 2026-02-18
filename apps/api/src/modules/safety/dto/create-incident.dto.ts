import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsDateString,
  IsUUID,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IncidentType, IncidentSeverity } from '@prisma/client';

export class CreateIncidentDto {
  @ApiProperty({ description: 'Job ID where incident occurred' })
  @IsUUID()
  @IsNotEmpty()
  jobId: string;

  @ApiProperty({ description: 'Date and time of the incident' })
  @IsDateString()
  @IsNotEmpty()
  incidentDate: string;

  @ApiProperty({ enum: IncidentType })
  @IsEnum(IncidentType)
  @IsNotEmpty()
  type: IncidentType;

  @ApiProperty({ enum: IncidentSeverity })
  @IsEnum(IncidentSeverity)
  @IsNotEmpty()
  severity: IncidentSeverity;

  @ApiProperty({ description: 'Title of the incident' })
  @IsString()
  @MinLength(1)
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'Detailed description of the incident' })
  @IsString()
  @IsNotEmpty()
  description: string;

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
}
