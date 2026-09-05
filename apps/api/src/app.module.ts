import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { validateEnv } from './config/env';
import { RequestContextModule } from './common/request-context/request-context.module';
import { RequestContextMiddleware } from './common/middleware/request-context.middleware';
import { AuthGuard } from './common/guards/auth.guard';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { JobsModule } from './jobs/jobs.module';
import { ExpensesModule } from './expenses/expenses.module';
import { ReceiptsModule } from './receipts/receipts.module';
import { QueueModule } from './queue/queue.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const redisUrl = configService.getOrThrow<string>('REDIS_URL');
        const url = new URL(redisUrl);
        return {
          connection: {
            host: url.hostname,
            port: Number(url.port || 6379),
            password: url.password || undefined,
          },
        };
      },
    }),
    ThrottlerModule.forRoot([
      { name: 'short', ttl: 1000, limit: 5 },
      { name: 'medium', ttl: 10000, limit: 30 },
      { name: 'long', ttl: 60000, limit: 100 },
    ]),
    RequestContextModule,
    PrismaModule,
    QueueModule,
    HealthModule,
    AuthModule,
    OrganizationsModule,
    JobsModule,
    ExpensesModule,
    ReceiptsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    LoggingInterceptor,
    HttpExceptionFilter,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestContextMiddleware).forRoutes('*');
  }
}
