import { IsString, IsNotEmpty, IsOptional, IsNumber, IsInt, Min, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateExpenseDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  jobId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  receiptId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  costCodeId?: string;

  @ApiProperty({ description: 'Amount in cents' })
  @IsInt()
  @Min(0)
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

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  mileage?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  imageKey?: string;

  @ApiProperty()
  @IsDateString()
  date: string;
}
