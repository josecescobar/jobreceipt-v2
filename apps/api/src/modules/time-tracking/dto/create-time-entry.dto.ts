import { IsString, IsNumber, IsOptional, IsDateString, IsPositive, IsInt, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTimeEntryDto {
  @ApiProperty()
  @IsString()
  jobId: string;

  @ApiProperty({ description: 'Entry date in ISO format' })
  @IsDateString()
  date: string;

  @ApiPropertyOptional({ description: 'Start time in HH:mm format' })
  @IsOptional()
  @IsString()
  startTime?: string;

  @ApiPropertyOptional({ description: 'End time in HH:mm format' })
  @IsOptional()
  @IsString()
  endTime?: string;

  @ApiProperty({ description: 'Total duration in minutes' })
  @IsNumber()
  @IsPositive()
  durationMinutes: number;

  @ApiProperty({ description: 'Hourly rate in cents' })
  @IsNumber()
  @Min(0)
  hourlyRate: number;

  @ApiPropertyOptional({ description: 'Overtime rate in cents per hour (null = 1.5x hourlyRate)' })
  @IsOptional()
  @IsInt()
  overtimeRate?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}
