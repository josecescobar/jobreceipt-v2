import { IsString, IsOptional, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateCloseOutDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  walkthroughDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  walkthroughNotes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  customerSignedName?: string;
}
