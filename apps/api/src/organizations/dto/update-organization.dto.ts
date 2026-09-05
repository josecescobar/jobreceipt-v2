import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Matches, MinLength } from 'class-validator';

export class UpdateOrganizationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9-]{3,50}$/, {
    message: 'Slug must be 3-50 characters, lowercase letters, numbers, and hyphens only',
  })
  slug?: string;
}
