import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3000),
  API_PREFIX: z.string().default('v1'),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  CLERK_SECRET_KEY: z.string().min(1),
  CLERK_PUBLISHABLE_KEY: z.string().min(1),
  CLERK_WEBHOOK_SECRET: z.string().optional().default(''),
  AWS_ACCESS_KEY_ID: z.string().min(1),
  AWS_SECRET_ACCESS_KEY: z.string().min(1),
  AWS_S3_BUCKET: z.string().min(1),
  AWS_S3_REGION: z.string().min(1),
  ANTHROPIC_API_KEY: z.string().min(1),
  OCR_PROVIDER: z.string().default('anthropic'),
  QB_CLIENT_ID: z.string().optional().default(''),
  QB_CLIENT_SECRET: z.string().optional().default(''),
  QB_REDIRECT_URI: z.string().optional().default(''),
  QB_ENVIRONMENT: z.string().optional().default('sandbox'),
  CORS_ORIGINS: z.string().optional().default('http://localhost:3001'),
});

export type AppEnv = z.infer<typeof envSchema>;
