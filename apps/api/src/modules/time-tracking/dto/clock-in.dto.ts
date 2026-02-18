import { IsString, IsOptional, IsInt } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ClockInDto {
  @ApiProperty({ description: 'Job ID to clock into' })
  @IsString()
  jobId: string;

  @ApiPropertyOptional({ description: 'Hourly rate in cents (defaults to last entry rate)' })
  @IsOptional()
  @IsInt()
  hourlyRate?: number;
}
