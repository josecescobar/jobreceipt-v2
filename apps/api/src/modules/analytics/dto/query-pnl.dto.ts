import { IsOptional, IsString, IsEnum, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryPnlDto {
  @ApiPropertyOptional({ enum: ['month', 'quarter', 'year', 'custom'] })
  @IsOptional()
  @IsEnum(['month', 'quarter', 'year', 'custom'])
  period?: 'month' | 'quarter' | 'year' | 'custom';

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
