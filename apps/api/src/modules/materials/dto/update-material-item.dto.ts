import { PartialType } from '@nestjs/swagger';
import { CreateMaterialItemDto } from './create-material-item.dto';

export class UpdateMaterialItemDto extends PartialType(CreateMaterialItemDto) {}
