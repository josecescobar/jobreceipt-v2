import { IsUUID, IsInt, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDrawRequestEntryDto {
  @ApiProperty({ description: 'Schedule of Values item ID' })
  @IsUUID()
  sovItemId: string;

  @ApiProperty({ description: 'Work completed this period in cents' })
  @IsInt()
  @Min(0)
  workCompletedThisPeriod: number;

  @ApiPropertyOptional({
    description: 'Materials stored in cents, defaults to 0',
    default: 0,
  })
  @IsInt()
  @Min(0)
  materialsStored?: number;
}
