import { envSchema, type AppEnv } from './env.schema';

export const validateEnv = (rawEnv: Record<string, unknown>): AppEnv => {
  const parsed = envSchema.safeParse(rawEnv);

  if (!parsed.success) {
    const formatted = parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('\n');
    throw new Error(`Environment validation failed:\n${formatted}`);
  }

  return parsed.data;
};
