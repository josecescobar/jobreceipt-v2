import { Prisma } from '@prisma/client';

/**
 * Safely casts a JSON-compatible value to Prisma.InputJsonValue.
 * Centralises the `as unknown as Prisma.InputJsonValue` double-cast
 * required when passing arbitrary but JSON-safe objects to Prisma.
 */
export function toPrismaJson(value: unknown): Prisma.InputJsonValue {
  return value as unknown as Prisma.InputJsonValue;
}
