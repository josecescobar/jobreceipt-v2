import {
  IsString,
  IsOptional,
  IsDateString,
  IsUUID,
  IsEmail,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateWarrantyDto {
  @ApiProperty()
  @IsUUID()
  jobId: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  manufacturer?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  warrantyProvider?: string;

  @ApiProperty()
  @IsDateString()
  startDate: string;

  @ApiProperty()
  @IsDateString()
  endDate: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contactPhone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  documentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
