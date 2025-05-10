import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

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

const pool = new Pool({
  connectionString: env.DATABASE_URL,
});
const db = drizzle({ client: pool, schema });
export default db;