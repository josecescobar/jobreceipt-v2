import { IsString, IsOptional, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryMessageDto {
  @IsString()
  jobId: string;

  @IsOptional()
  @IsString()
  before?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  limit?: number;
}
