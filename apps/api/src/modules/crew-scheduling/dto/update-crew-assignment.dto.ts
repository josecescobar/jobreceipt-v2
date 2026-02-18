import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

enum CrewAssignmentStatus {
  SCHEDULED = 'SCHEDULED',
  COMPLETED = 'COMPLETED',
  NO_SHOW = 'NO_SHOW',
}

export class UpdateCrewAssignmentDto {
  @ApiPropertyOptional({ enum: CrewAssignmentStatus })
  @IsOptional()
  @IsEnum(CrewAssignmentStatus)
  status?: CrewAssignmentStatus;

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
