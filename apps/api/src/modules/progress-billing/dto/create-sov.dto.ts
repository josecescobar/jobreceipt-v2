import {
  IsUUID,
  IsNumber,
  IsOptional,
  IsString,
  IsArray,
  ValidateNested,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CreateSOVItemDto } from './create-sov-item.dto';

export class CreateSOVDto {
  @ApiProperty({ description: 'Job ID to attach the schedule of values to' })
  @IsUUID()
  jobId: string;

  @ApiPropertyOptional({
    description: 'Retainage percentage (0-100), defaults to 10',
    default: 10,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  retainagePercent?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ type: [CreateSOVItemDto], description: 'Line items for the SOV' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSOVItemDto)
  items: CreateSOVItemDto[];
}
