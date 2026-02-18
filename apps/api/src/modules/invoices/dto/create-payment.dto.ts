import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsDateString, IsEnum, IsOptional, IsString, IsPositive } from 'class-validator';

export class CreatePaymentDto {
  @ApiProperty({ description: 'Payment amount in cents' })
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiProperty({ description: 'Payment date in ISO format' })
  @IsDateString()
  date: string;

  @ApiProperty({ enum: ['CASH', 'CHECK', 'BANK_TRANSFER', 'CREDIT_CARD', 'OTHER'] })
  @IsEnum(['CASH', 'CHECK', 'BANK_TRANSFER', 'CREDIT_CARD', 'OTHER'])
  method: 'CASH' | 'CHECK' | 'BANK_TRANSFER' | 'CREDIT_CARD' | 'OTHER';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}
