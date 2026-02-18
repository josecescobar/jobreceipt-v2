import { IsString, IsNotEmpty, IsArray, IsDateString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCrewAssignmentDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  jobId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ description: 'Array of date strings for batch creation', type: [String] })
  @IsArray()
  @IsDateString({ strict: true }, { each: true })
  dates: string[];

  @ApiPropertyOptional({ description: 'Start time in HH:MM format' })
  @IsOptional()
  @IsString()
  startTime?: string;

  @ApiPropertyOptional({ description: 'End time in HH:MM format' })
  @IsOptional()
  @IsString()
  endTime?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
