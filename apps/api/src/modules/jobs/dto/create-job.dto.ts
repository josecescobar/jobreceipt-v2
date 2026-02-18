import { IsString, IsNotEmpty, IsOptional, IsNumber, IsInt, Min, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateJobDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  customerName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  customerAddress?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  customerLat?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  customerLng?: number;

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

  @ApiPropertyOptional({ description: 'Contract value / revenue in cents' })
  @IsOptional()
  @IsInt()
  @Min(0)
  contractValue?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  customerId?: string;
}
