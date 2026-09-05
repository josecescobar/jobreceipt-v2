import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  const corsOrigins = config.get<string>('CORS_ORIGINS', 'http://localhost:3001');
  const allowedOrigins = corsOrigins.split(',').map((o) => o.trim());
  app.enableCors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-org-id', 'x-request-id'],
    credentials: true,
    maxAge: 86400,
  });
  app.setGlobalPrefix(config.get<string>('API_PREFIX', 'v1'));
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.useGlobalInterceptors(app.get(LoggingInterceptor));
  app.useGlobalFilters(app.get(HttpExceptionFilter));

  const swagger = new DocumentBuilder()
    .setTitle('JobReceipt API')
    .setDescription('Milestone 1 Snap & Store API')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swagger);
  SwaggerModule.setup('docs', app, document);

  const port = config.get<number>('PORT', 3000);
  await app.listen(port);
}

void bootstrap();
