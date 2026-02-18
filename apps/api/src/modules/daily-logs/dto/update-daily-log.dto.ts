import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateDailyLogDto } from './create-daily-log.dto';

export class UpdateDailyLogDto extends PartialType(
  OmitType(CreateDailyLogDto, ['jobId', 'date'] as const),
) {}
