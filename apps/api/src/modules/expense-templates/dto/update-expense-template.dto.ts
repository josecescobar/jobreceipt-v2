import { PartialType } from '@nestjs/swagger';
import { CreateExpenseTemplateDto } from './create-expense-template.dto';

export class UpdateExpenseTemplateDto extends PartialType(CreateExpenseTemplateDto) {}
