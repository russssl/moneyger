import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import { drizzle } from "drizzle-orm/node-postgres";
import { neon } from "@neondatabase/serverless";
import { Pool } from "pg";
import * as schema from "./schema";
import { type NeonHttpDatabase } from "drizzle-orm/neon-http";
import { type NodePgDatabase } from "drizzle-orm/node-postgres";

/**
 * Cache the database connection in development. This avoids creating a new connection on every HMR
 * update.
 */
// const globalForDb = globalThis as unknown as {
//   conn: postgres.Sql | undefined;
// };
const env = process.env;
if (!env) {
  throw new Error("Environment variables not loaded");
}

let db: NeonHttpDatabase<typeof schema> | NodePgDatabase<typeof schema>;

if (process.env.NODE_ENV === "development" || env.FORCE_PG_POOL) {
  const pool = new Pool({
    connectionString: env.DATABASE_URL,
  });
  db = drizzle({ client: pool, schema });
} else {
  const sql = neon(process.env.DATABASE_URL!);
  db = drizzleNeon(sql, { schema });
}
export default db;