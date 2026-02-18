import { Module } from '@nestjs/common';
import { PublicController } from './public.controller';
import { PublicService } from './public.service';
import { InvoicesModule } from '../invoices/invoices.module';
import { EstimatesModule } from '../estimates/estimates.module';

@Module({
  imports: [InvoicesModule, EstimatesModule],
  controllers: [PublicController],
  providers: [PublicService],
})
export class PublicModule {}
