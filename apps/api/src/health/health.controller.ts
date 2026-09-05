import { Controller, Get, Header } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { Public } from '../common/decorators/public.decorator';
import { QueueMetrics } from '../queue/queue.metrics';
import { HealthService } from './health.service';

@ApiTags('health')
@SkipThrottle()
@Controller('health')
export class HealthController {
  constructor(
    private readonly healthService: HealthService,
    private readonly metrics: QueueMetrics,
  ) {}

  @Public()
  @Get()
  getHealth() {
    return this.healthService.health();
  }

  @Public()
  @Get('metrics')
  @Header('Content-Type', 'text/plain')
  async getMetrics(): Promise<string> {
    return this.metrics.metrics();
  }
}
