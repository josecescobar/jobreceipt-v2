import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class CreateExpenseDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  jobId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  costCodeId?: string;

  @ApiProperty({ description: 'Expense amount in cents', example: 12999 })
  @IsInt()
  @Min(0)
  amountCents!: number;

  @ApiProperty({ example: 'Manual expense entry from supply counter' })
  @IsString()
  @IsNotEmpty()
  description!: string;

  @ApiPropertyOptional({ example: 'MATERIALS' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ example: 'line_22' })
  @IsOptional()
  @IsString()
  taxCategory?: string;

  @ApiProperty({ example: '2026-02-14T00:00:00.000Z' })
  @IsDateString()
  date!: string;
}
