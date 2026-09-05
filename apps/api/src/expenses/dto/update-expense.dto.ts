import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class UpdateExpenseDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  jobId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  costCodeId?: string;

  @ApiPropertyOptional({ description: 'Expense amount in cents' })
  @IsOptional()
  @IsInt()
  @Min(0)
  amountCents?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'MATERIALS' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ example: 'line_22' })
  @IsOptional()
  @IsString()
  taxCategory?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  date?: string;
}
