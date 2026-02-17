import { IsString, IsNumber, IsOptional, IsDateString, IsPositive } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMileageDto {
  @ApiProperty()
  @IsString()
  jobId: string;

  @ApiProperty()
  @IsNumber()
  startLat: number;

  @ApiProperty()
  @IsNumber()
  startLng: number;

  @ApiProperty()
  @IsNumber()
  endLat: number;

  @ApiProperty()
  @IsNumber()
  endLng: number;

  @ApiProperty({ description: 'Distance in miles' })
  @IsNumber()
  @IsPositive()
  distanceMiles: number;

  @ApiPropertyOptional({ description: 'IRS rate in cents per mile. Defaults to current year rate.' })
  @IsOptional()
  @IsNumber()
  irsRate?: number;

  @ApiProperty({ description: 'Trip date in ISO format' })
  @IsDateString()
  date: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  purpose?: string;
}
