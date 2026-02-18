import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsArray,
  ValidateNested,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';

export class DateRangeDto {
  @ApiProperty()
  @IsString()
  start: string;

  @ApiProperty()
  @IsString()
  end: string;
}

export class GenerateReportDto {
  @ApiProperty()
  @IsString()
  @IsIn(['job_summary', 'profitability', 'labor_hours', 'expense_detail', 'tax_deductions'])
  type: string;

  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty()
  @ValidateNested()
  @Type(() => DateRangeDto)
  dateRange: DateRangeDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  jobIds?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categories?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  crewUserIds?: string[];

  @ApiProperty()
  @IsString()
  @IsIn(['pdf', 'csv'])
  format: string;
}
