import {
  IsString,
  IsInt,
  IsUUID,
  IsOptional,
  MinLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSOVItemDto {
  @ApiProperty({ description: 'Item number, e.g. "001"' })
  @IsString()
  @MinLength(1)
  itemNumber: string;

  @ApiProperty({ description: 'Description of the work item' })
  @IsString()
  @MinLength(1)
  description: string;

  @ApiProperty({ description: 'Scheduled value in cents' })
  @IsInt()
  @Min(0)
  scheduledValue: number;

  @ApiPropertyOptional({ description: 'Optional cost code ID' })
  @IsOptional()
  @IsUUID()
  costCodeId?: string;
}
