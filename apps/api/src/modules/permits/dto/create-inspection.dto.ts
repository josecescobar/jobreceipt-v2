import { IsString, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateInspectionDto {
  @ApiProperty()
  @IsDateString()
  scheduledDate: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  inspector?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
