import { ApiPropertyOptional } from '@nestjs/swagger';
import { JobStatus } from '@prisma/client';
import { IsDateString, IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class UpdateJobDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  customerName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  customerAddress?: string;

  @ApiPropertyOptional({ enum: JobStatus })
  @IsOptional()
  @IsEnum(JobStatus)
  status?: JobStatus;

  @ApiPropertyOptional({ description: 'Budget in cents' })
  @IsOptional()
  @IsInt()
  @Min(0)
  budgetTotalCents?: number;

  @ApiPropertyOptional({ description: 'Materials budget in cents' })
  @IsOptional()
  @IsInt()
  @Min(0)
  budgetMaterialsCents?: number;

  @ApiPropertyOptional({ description: 'Labor budget in cents' })
  @IsOptional()
  @IsInt()
  @Min(0)
  budgetLaborCents?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
