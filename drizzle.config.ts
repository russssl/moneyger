import { type Config } from "drizzle-kit";

import { env } from "@/env";

export default {
  schema: "./src/server/db/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    user: env.POSTGRES_USER,
    password: env.POSTGRES_PASSWORD,
    database: env.POSTGRES_DB,
    host: env.POSTGRES_HOST,
    port: Number(env.POSTGRES_PORT) || 5432, // Use environment variable for port with fallback
    ssl: env.NODE_ENV === "production" ?  process.env.POSTGRES_SSL === "true" ? { rejectUnauthorized: false } : undefined : undefined,
  },
  tablesFilter: ["manager_v2_*"],
} satisfies Config;
