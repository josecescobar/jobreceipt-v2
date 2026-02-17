import { IsOptional, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryAnalyticsDto {
  @ApiPropertyOptional({ description: 'Start of date range (ISO date)' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End of date range (ISO date)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
