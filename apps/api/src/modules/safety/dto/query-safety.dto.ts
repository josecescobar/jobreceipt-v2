import { IsString, IsOptional, IsNumberString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QuerySafetyDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  jobId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  severity?: string;

  @ApiPropertyOptional({ default: '1' })
  @IsOptional()
  @IsNumberString()
  page?: string;

  @ApiPropertyOptional({ default: '20' })
  @IsOptional()
  @IsNumberString()
  limit?: string;
}
