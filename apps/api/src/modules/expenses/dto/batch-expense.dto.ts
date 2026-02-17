import { IsString, IsArray, ArrayMinSize, ArrayMaxSize, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BatchDeleteExpensesDto {
  @ApiProperty({ description: 'Array of expense IDs to delete' })
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
