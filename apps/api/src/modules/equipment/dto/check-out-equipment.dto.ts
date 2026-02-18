import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CheckOutEquipmentDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  equipmentId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  jobId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
