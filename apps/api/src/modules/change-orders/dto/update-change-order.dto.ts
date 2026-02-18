import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
  IsEnum,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateChangeOrderLineItemDto } from './create-change-order.dto';

export class UpdateChangeOrderDto {
  @ApiPropertyOptional({ enum: ['DRAFT', 'SUBMITTED'] })
  @IsOptional()
  @IsEnum(['DRAFT', 'SUBMITTED'])
  status?: 'DRAFT' | 'SUBMITTED';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({ description: 'Tax rate as decimal, e.g. 0.08 for 8%' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  taxRate?: number;

  @ApiPropertyOptional({ type: [CreateChangeOrderLineItemDto], description: 'Full replacement of line items (DRAFT only)' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateChangeOrderLineItemDto)
  lineItems?: CreateChangeOrderLineItemDto[];
}
