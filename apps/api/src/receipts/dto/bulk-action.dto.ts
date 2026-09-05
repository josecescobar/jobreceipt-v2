import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsEnum, IsString } from 'class-validator';

export enum BulkAction {
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
  DELETE = 'DELETE',
}

export class BulkActionDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  receiptIds!: string[];

  @ApiProperty({ enum: BulkAction })
  @IsEnum(BulkAction)
  action!: BulkAction;
}
