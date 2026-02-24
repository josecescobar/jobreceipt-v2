import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePhotoDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  imageKey: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  caption?: string;
}
