import {
  IsString,
  IsOptional,
  IsDateString,
  IsInt,
  IsUUID,
  IsEnum,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PermitType } from '@prisma/client';

export class CreatePermitDto {
  @ApiProperty()
  @IsUUID()
  jobId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  permitNumber?: string;

  @ApiProperty({ enum: PermitType })
  @IsEnum(PermitType)
  type: PermitType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  appliedDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  issuedDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  authority?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  fee?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  documentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
