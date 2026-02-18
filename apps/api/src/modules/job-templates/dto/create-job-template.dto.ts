import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  IsNumber,
  IsArray,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateJobTemplateLineItemDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Estimated amount in cents' })
  @IsOptional()
  @IsInt()
  @Min(0)
  estimatedAmount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  costCodeId?: string;
}

export class CreateJobTemplateDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  customerName?: string;

  @ApiPropertyOptional({ description: 'Budget in cents' })
  @IsOptional()
  @IsInt()
  @Min(0)
  budgetTotal?: number;

  @ApiPropertyOptional({ description: 'Materials budget in cents' })
  @IsOptional()
  @IsInt()
  @Min(0)
  budgetMaterials?: number;

  @ApiPropertyOptional({ description: 'Labor budget in cents' })
  @IsOptional()
  @IsInt()
  @Min(0)
  budgetLabor?: number;

  @ApiPropertyOptional({ description: 'Contract value in cents' })
  @IsOptional()
  @IsInt()
  @Min(0)
  contractValue?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ type: [CreateJobTemplateLineItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateJobTemplateLineItemDto)
  lineItems?: CreateJobTemplateLineItemDto[];
}
