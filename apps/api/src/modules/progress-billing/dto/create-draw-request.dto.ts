import {
  IsUUID,
  IsDateString,
  IsOptional,
  IsString,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CreateDrawRequestEntryDto } from './create-draw-request-entry.dto';

export class CreateDrawRequestDto {
  @ApiProperty({ description: 'Schedule of Values ID' })
  @IsUUID()
  scheduleId: string;

  @ApiProperty({ description: 'Period ending date (ISO date string)' })
  @IsDateString()
  periodTo: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({
    type: [CreateDrawRequestEntryDto],
    description: 'Entries for each SOV line item',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateDrawRequestEntryDto)
  entries: CreateDrawRequestEntryDto[];
}
