import { PartialType } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CreateWarrantyDto } from './create-warranty.dto';

export class UpdateWarrantyDto extends PartialType(CreateWarrantyDto) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;
}
