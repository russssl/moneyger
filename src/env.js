import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    AUTH_SECRET: z.string(),
    // Support both DATABASE_URL and individual postgres vars
    POSTGRES_USER: z.string(),
    POSTGRES_PASSWORD: z.string(),
    POSTGRES_DB: z.string(),
    POSTGRES_HOST: z.string(),
    POSTGRES_PORT: z.string().default("5432"),
    NODE_ENV: z
      .enum(["development", "staging", "production"])
      .default("development"),
    REDIS_KV_URL: z.string().url().optional(),
    REDIS_KV_REST_API_READ_ONLY_TOKEN: z.string().optional(),
    REDIS_KV_REST_API_TOKEN: z.string().optional(),
    REDIS_KV_REST_API_URL: z.string().url().optional(),
    GITHUB_CLIENT_ID: z.string().optional(),
    GITHUB_CLIENT_SECRET: z.string().optional(),
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),
    RESEND_API_KEY: z.string().optional(),
    EXCHANGE_RATE_URL: z.string().url().default("https://api.fxratesapi.com/"),
    EXCHANGE_RATE_API_KEY: z.string().optional(),
    REDIS_URL: z.string().url().default("redis://localhost:6379"),
    PORT: z.string().default("3000"),
  },
  client: {
    NEXT_PUBLIC_NODE_ENV: z
      .enum(["development", "staging", "production"])
      .default("development"),
    NEXT_PUBLIC_APP_URL: z.string().url(),
  },
  runtimeEnv: {
    AUTH_SECRET: process.env.AUTH_SECRET,
    POSTGRES_USER: process.env.POSTGRES_USER,
    POSTGRES_PASSWORD: process.env.POSTGRES_PASSWORD,
    POSTGRES_DB: process.env.POSTGRES_DB,
    POSTGRES_HOST: process.env.POSTGRES_HOST,
    POSTGRES_PORT: process.env.POSTGRES_PORT,
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_NODE_ENV: process.env.NEXT_PUBLIC_NODE_ENV,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    REDIS_KV_URL: process.env.REDIS_KV_URL,
    REDIS_KV_REST_API_READ_ONLY_TOKEN:
      process.env.REDIS_KV_REST_API_READ_ONLY_TOKEN,
    REDIS_KV_REST_API_TOKEN: process.env.REDIS_KV_REST_API_TOKEN,
    REDIS_KV_REST_API_URL: process.env.REDIS_KV_REST_API_URL,
    GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    EXCHANGE_RATE_URL: process.env.EXCHANGE_RATE_URL,
    EXCHANGE_RATE_API_KEY: process.env.EXCHANGE_RATE_API_KEY,
    REDIS_URL: process.env.REDIS_URL,
    PORT: process.env.PORT,
  },
  skipValidation: process.env.CI === "true" || process.env.SKIP_ENV_VALIDATION === "true",
  emptyStringAsUndefined: true,
});
