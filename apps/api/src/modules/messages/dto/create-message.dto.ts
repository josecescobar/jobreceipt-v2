import { IsString, MinLength } from 'class-validator';

export class CreateMessageDto {
  @IsString()
  jobId: string;

  @IsString()
  @MinLength(1)
  body: string;
}
