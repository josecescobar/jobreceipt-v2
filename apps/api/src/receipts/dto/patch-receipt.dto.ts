import { ApiPropertyOptional } from '@nestjs/swagger';
import { ReceiptStatus } from '@prisma/client';
import { IsDateString, IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class PatchReceiptDto {
  @ApiPropertyOptional({ enum: ReceiptStatus })
  @IsOptional()
  @IsEnum(ReceiptStatus)
  status?: ReceiptStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  jobId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  merchantName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  merchantAddress?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  transactionDate?: string;

  @ApiPropertyOptional({ description: 'Subtotal in cents' })
  @IsOptional()
  @IsInt()
  @Min(0)
  subtotalCents?: number;

  @ApiPropertyOptional({ description: 'Tax amount in cents' })
  @IsOptional()
  @IsInt()
  @Min(0)
  taxAmountCents?: number;

  @ApiPropertyOptional({ description: 'Total in cents' })
  @IsOptional()
  @IsInt()
  @Min(0)
  totalAmountCents?: number;
}
