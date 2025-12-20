import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";
import { env } from "@/env";

const pool = new Pool({
  user: env.POSTGRES_USER,
  password: env.POSTGRES_PASSWORD,
  database: env.POSTGRES_DB,
  host: env.POSTGRES_HOST,
  port: Number(env.POSTGRES_PORT) || 5432,
  ssl: false,
});
const db = drizzle({ client: pool, schema });
export default db;