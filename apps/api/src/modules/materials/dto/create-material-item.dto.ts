import {
  IsString,
  IsOptional,
  IsInt,
  IsNumber,
  Min,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMaterialItemDto {
  @ApiProperty()
  @IsString()
  jobId: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sku?: string;

  @ApiPropertyOptional({ default: 'ea' })
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiProperty({ description: 'Unit cost in cents' })
  @IsInt()
  @Min(0)
  unitCost: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  costCodeId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  purchasedQty?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
