import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsInt, IsOptional, IsString, Min, ValidateNested } from 'class-validator';

class SplitLineItemDto {
  @ApiProperty()
  @IsString()
  lineItemId!: string;

  @ApiProperty()
  @IsString()
  jobId!: string;
}

export class SplitReceiptDto {
  @ApiProperty({ type: [SplitLineItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SplitLineItemDto)
  lineItems!: SplitLineItemDto[];

  @ApiProperty({ required: false, description: 'Unassigned cents allowed when not all items map to jobs' })
  @IsOptional()
  @IsInt()
  @Min(0)
  unassignedRemainderCents?: number;
}
