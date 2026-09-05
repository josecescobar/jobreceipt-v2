import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class CreateJobDto {
  @ApiProperty({ example: 'Smith Roof Replacement' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({ example: 'John Smith' })
  @IsOptional()
  @IsString()
  customerName?: string;

  @ApiPropertyOptional({ example: '121 Main St, Hagerstown, MD' })
  @IsOptional()
  @IsString()
  customerAddress?: string;

  @ApiPropertyOptional({ example: 2500000, description: 'Budget in cents' })
  @IsOptional()
  @IsInt()
  @Min(0)
  budgetTotalCents?: number;

  @ApiPropertyOptional({ example: 1400000, description: 'Materials budget in cents' })
  @IsOptional()
  @IsInt()
  @Min(0)
  budgetMaterialsCents?: number;

  @ApiPropertyOptional({ example: 800000, description: 'Labor budget in cents' })
  @IsOptional()
  @IsInt()
  @Min(0)
  budgetLaborCents?: number;

  @ApiPropertyOptional({ example: '2026-02-14' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-03-01' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
