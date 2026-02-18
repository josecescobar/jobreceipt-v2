import { IsString, IsOptional, IsInt, Min, IsDateString, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

enum ReceiptStatus {
  PROCESSING = 'PROCESSING',
  REVIEW = 'REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export class UpdateReceiptDto {
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
  @IsInt()
  @Min(0)
  subtotal?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  taxAmount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  totalAmount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  transactionDate?: string;

  @ApiPropertyOptional({ enum: ReceiptStatus })
  @IsOptional()
  @IsEnum(ReceiptStatus)
  status?: ReceiptStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  suggestedJobId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  duplicateOfId?: string | null;
}
