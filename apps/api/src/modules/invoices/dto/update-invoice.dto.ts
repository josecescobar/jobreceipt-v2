import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
  IsEnum,
  ValidateNested,
  IsDateString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateInvoiceLineItemDto } from './create-invoice.dto';

export class UpdateInvoiceDto {
  @ApiPropertyOptional({ enum: ['DRAFT', 'SENT', 'PARTIALLY_PAID', 'PAID'] })
  @IsOptional()
  @IsEnum(['DRAFT', 'SENT', 'PARTIALLY_PAID', 'PAID'])
  status?: 'DRAFT' | 'SENT' | 'PARTIALLY_PAID' | 'PAID';

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  issueDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Tax rate as decimal, e.g. 0.08 for 8%' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  taxRate?: number;

  @ApiPropertyOptional({ type: [CreateInvoiceLineItemDto], description: 'Full replacement of line items' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateInvoiceLineItemDto)
  lineItems?: CreateInvoiceLineItemDto[];
}
