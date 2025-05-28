import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = !process.env.CI ? createEnv({
  /**
   * Specify your server-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars.
   */
  server: {
    AUTH_SECRET:
      process.env.NODE_ENV === "production"
        ? z.string()
        : z.string().optional(),

    DATABASE_URL: z.string(),

    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    REDIS_KV_URL: z.string().optional(),
    REDIS_KV_REST_API_READ_ONLY_TOKEN: z.string().optional(),
    REDIS_KV_REST_API_TOKEN: z.string().optional(),
    REDIS_KV_REST_API_URL: z.string().optional(),
    GITHUB_CLIENT_ID: z.string().optional(),
    GITHUB_CLIENT_SECRET: z.string().optional(),
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),
  },

  /**
   * Specify your client-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars. To expose them to the client, prefix them with
   * `NEXT_PUBLIC_`.
   */
  client: {
    // NEXT_PUBLIC_CLIENTVAR: z.string(),
  },

  /**
   * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
   * middlewares) or client-side so we need to destruct manually.
   */
  runtimeEnv: {
    AUTH_SECRET: process.env.AUTH_SECRET,
    DATABASE_URL: process.env.DATABASE_URL,
    NODE_ENV: process.env.NODE_ENV,
    REDIS_KV_URL: process.env.REDIS_KV_URL,
    REDIS_KV_REST_API_READ_ONLY_TOKEN: process.env.REDIS_KV_REST_API_READ_ONLY_TOKEN,
    REDIS_KV_REST_API_TOKEN: process.env.REDIS_KV_REST_API_TOKEN,
    REDIS_KV_REST_API_URL: process.env.REDIS_KV_REST_API_URL,
    GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  },
  /**
   * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially
   * useful for Docker builds.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  /**
   * Makes it so that empty strings are treated as undefined. `SOME_VAR: z.string()` and
   * `SOME_VAR=''` will throw an error.
   */
  emptyStringAsUndefined: true,
}) : null;