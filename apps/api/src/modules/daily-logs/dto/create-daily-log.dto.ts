import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsOptional,
  IsEnum,
  IsInt,
  IsNumber,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WeatherCondition } from '@prisma/client';

export class CreateDailyLogDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  jobId: string;

  @ApiProperty({ description: 'Log date in ISO format' })
  @IsDateString()
  date: string;

  @ApiPropertyOptional({ enum: WeatherCondition })
  @IsOptional()
  @IsEnum(WeatherCondition)
  weather?: WeatherCondition;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  temperature?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  crewCount?: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  workPerformed: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  materialsUsed?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  safetyNotes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  hoursWorked?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
