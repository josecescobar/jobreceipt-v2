import { IsString, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateWarrantyClaimDto {
  @ApiProperty()
  @IsDateString()
  claimDate: string;

  @ApiProperty()
  @IsString()
  description: string;
}
