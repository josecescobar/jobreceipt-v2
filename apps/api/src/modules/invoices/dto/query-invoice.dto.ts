import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryInvoiceDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  jobId?: string;

  @ApiPropertyOptional({ enum: ['DRAFT', 'SENT', 'PARTIALLY_PAID', 'PAID'] })
  @IsOptional()
  @IsEnum(['DRAFT', 'SENT', 'PARTIALLY_PAID', 'PAID'])
  status?: 'DRAFT' | 'SENT' | 'PARTIALLY_PAID' | 'PAID';

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  limit?: number;
}
