import { IsString, IsOptional, IsInt, IsNumber, IsBoolean, Min, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateLineItemDto {
  @ApiProperty()
  @IsString()
  @MaxLength(500)
  description: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  quantity: number;

  @ApiProperty({ description: 'Unit price in cents' })
  @IsInt()
  @Min(0)
  unitPrice: number;

  @ApiProperty({ description: 'Total price in cents' })
  @IsInt()
  @Min(0)
  totalPrice: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isConstructionMaterial?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  materialCategory?: string | null;
}

export class UpdateLineItemDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  quantity?: number;

  @ApiPropertyOptional({ description: 'Unit price in cents' })
  @IsOptional()
  @IsInt()
  @Min(0)
  unitPrice?: number;

  @ApiPropertyOptional({ description: 'Total price in cents' })
  @IsOptional()
  @IsInt()
  @Min(0)
  totalPrice?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isConstructionMaterial?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  materialCategory?: string | null;
}
