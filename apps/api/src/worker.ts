import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrapWorker(): Promise<void> {
  const logger = new Logger('WorkerBootstrap');
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  logger.log('OCR worker context started and listening for queue jobs');

  const shutdown = async (): Promise<void> => {
    logger.log('Shutting down worker context');
    await app.close();
    process.exit(0);
  };

  process.on('SIGTERM', () => {
    void shutdown();
  });

  process.on('SIGINT', () => {
    void shutdown();
  });
}

void bootstrapWorker();
