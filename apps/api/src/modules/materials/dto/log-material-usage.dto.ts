import { IsString, IsOptional, IsNumber, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LogMaterialUsageDto {
  @ApiProperty()
  @IsString()
  materialItemId: string;

  @ApiProperty()
  @IsNumber()
  @Min(0.01)
  qty: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  jobId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
