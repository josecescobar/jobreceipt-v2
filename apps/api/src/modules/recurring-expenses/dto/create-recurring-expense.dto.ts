import { IsString, IsNotEmpty, IsOptional, IsInt, Min, IsDateString, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRecurringExpenseDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  jobId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  costCodeId?: string;

  @ApiProperty({ description: 'Amount in cents' })
  @IsInt()
  @Min(1)
  amount: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  taxCategory?: string;

  @ApiProperty({ enum: ['WEEKLY', 'BIWEEKLY', 'MONTHLY'] })
  @IsEnum(['WEEKLY', 'BIWEEKLY', 'MONTHLY'])
  frequency: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY';

  @ApiProperty()
  @IsDateString()
  startDate: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
