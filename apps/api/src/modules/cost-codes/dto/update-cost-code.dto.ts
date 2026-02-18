import { PartialType } from '@nestjs/swagger';
import { CreateCostCodeDto } from './create-cost-code.dto';

export class UpdateCostCodeDto extends PartialType(CreateCostCodeDto) {}
