import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ConfirmUploadDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  receiptId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  imageKey: string;
}
