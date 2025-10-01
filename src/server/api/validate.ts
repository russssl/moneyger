// validate the request body against a zod schema

import { type z } from "zod";

export async function validate<T>(object: T, schema: z.ZodSchema<T>): Promise<T | { error: string }> {
  const result = schema.safeParse(object);
  if (!result.success) {
    return { error: result.error.message };
  }
  return object;
}