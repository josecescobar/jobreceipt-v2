import { IsString, IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSafetyInspectionDto {
  @ApiProperty({ description: 'Job ID to associate inspection with' })
  @IsUUID()
  @IsNotEmpty()
  jobId: string;

  @ApiProperty({ description: 'Template name to use for the inspection' })
  @IsString()
  @IsNotEmpty()
  templateName: string;
}
