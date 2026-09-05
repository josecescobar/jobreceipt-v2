import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class CreateOrganizationDto {
  @ApiProperty({ example: 'Real Elite Contracting' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 'real-elite-contracting' })
  @IsString()
  @Matches(/^[a-z0-9-]{3,50}$/)
  slug!: string;
}
