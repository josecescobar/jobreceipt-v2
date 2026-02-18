import { IsNumber, IsOptional, IsString, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateSOVDto {
  @ApiPropertyOptional({ description: 'Retainage percentage (0-100)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  retainagePercent?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
