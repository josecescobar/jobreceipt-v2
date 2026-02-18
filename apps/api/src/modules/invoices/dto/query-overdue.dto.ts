import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryOverdueDto {
  @ApiPropertyOptional({ description: 'Aging bucket range, e.g. "1-30", "31-60", "61-90", "90+"' })
  @IsOptional()
  @IsString()
  bucket?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  limit?: number;
}
