import { IsString, IsArray, ArrayMinSize, ArrayMaxSize, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CreateExpenseDto } from './create-expense.dto';

export class BatchDeleteExpensesDto {
  @ApiProperty({ description: 'Array of expense IDs to delete' })
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  ids: string[];
}

export class BatchCreateExpensesDto {
  @ApiProperty({ description: 'Array of expenses to create', type: [CreateExpenseDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateExpenseDto)
  @ArrayMinSize(2)
  @ArrayMaxSize(10)
  items: CreateExpenseDto[];
}

export class BatchApproveExpensesDto {
  @ApiProperty({ description: 'Array of expense IDs to approve' })
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  ids: string[];
}

export class BatchRejectExpensesDto {
  @ApiProperty({ description: 'Array of expense IDs to reject' })
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  ids: string[];
}

export class BatchUpdateExpensesDto {
  @ApiProperty({ description: 'Array of expense IDs to update' })
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  ids: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  jobId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string;
}
