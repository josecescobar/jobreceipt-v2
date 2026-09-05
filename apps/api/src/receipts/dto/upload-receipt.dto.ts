import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class UploadReceiptDto {
  @ApiProperty({ example: 'receipt-home-depot.jpg' })
  @IsString()
  @IsNotEmpty()
  fileName!: string;

  @ApiProperty({ example: 'image/jpeg' })
  @IsString()
  @IsNotEmpty()
  contentType!: string;
}
