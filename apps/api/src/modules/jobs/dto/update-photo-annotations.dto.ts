import { IsArray, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdatePhotoAnnotationsDto {
  @ApiProperty({ type: [Object] })
  @IsArray()
  annotations: any[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  annotatedImageKey?: string;
}
