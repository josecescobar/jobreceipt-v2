import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateChecklistItemDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  status: string; // 'PENDING' | 'COMPLETE' | 'WAIVED'

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
