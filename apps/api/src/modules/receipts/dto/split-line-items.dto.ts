import { IsArray, IsString, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

class LineItemAssignment {
  @ApiProperty()
  @IsString()
  lineItemId: string;

  @ApiProperty()
  @IsString()
  jobId: string;
}

export class SplitLineItemsDto {
  @ApiProperty({ type: [LineItemAssignment] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LineItemAssignment)
  assignments: LineItemAssignment[];
}
