import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";
import { env } from "@/env";

let pool: Pool;

// Use process.env directly to avoid any validation/stripping issues
const dbUser = process.env.POSTGRES_USER?.trim() || "";
const dbPassword = process.env.POSTGRES_PASSWORD?.trim() || "";
const dbHost = process.env.POSTGRES_HOST?.trim() || "";
const dbName = process.env.POSTGRES_DB?.trim() || "";
const dbPort = Number(process.env.POSTGRES_PORT?.trim()) || 5432;
const dbUrl = process.env.DATABASE_URL?.trim();

// Log raw process.env values (for Portainer debugging)
console.log("🔍 PostgreSQL Environment Check:", {
  POSTGRES_USER: dbUser ? `${dbUser.substring(0, 3)}...` : "❌ NOT SET",
  POSTGRES_PASSWORD: dbPassword ? `***${dbPassword.length} chars***` : "❌ NOT SET",
  POSTGRES_DB: dbName || "❌ NOT SET",
  POSTGRES_HOST: dbHost || "❌ NOT SET",
  POSTGRES_PORT: dbPort,
  DATABASE_URL: dbUrl ? "✅ SET" : "❌ NOT SET",
});

// Prefer DATABASE_URL if provided (handles special chars in password better)
if (dbUrl) {
  console.log("✅ Using DATABASE_URL for PostgreSQL connection");
  pool = new Pool({
    connectionString: dbUrl,
    ssl: false,
    connectionTimeoutMillis: 10000,
    max: 10,
  });
} else {
  // Validate required vars
  if (!dbUser || !dbPassword || !dbName || !dbHost) {
    console.error("❌ Missing PostgreSQL env vars:", {
      POSTGRES_USER: !!dbUser,
      POSTGRES_PASSWORD: !!dbPassword,
      POSTGRES_DB: !!dbName,
      POSTGRES_HOST: !!dbHost,
    });
    throw new Error(
      "Missing required PostgreSQL environment variables. Please set either DATABASE_URL or POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB, POSTGRES_HOST"
    );
  }

  // Log connection details (without password) for debugging
  console.log("✅ PostgreSQL connection config:", {
    user: dbUser,
    host: dbHost,
    port: dbPort,
    database: dbName,
    passwordLength: dbPassword.length,
  });

  pool = new Pool({
    user: dbUser,
    password: dbPassword,
    database: dbName,
    host: dbHost,
    port: dbPort,
    ssl: false,
    connectionTimeoutMillis: 10000,
    max: 10,
  });
}

// Add error handling for connection issues
pool.on("error", (err) => {
  console.error("💥 PostgreSQL pool error:", {
    message: err.message,
    code: err.code,
    severity: err.severity,
  });
  // If it's an auth error, log the credentials being used
  if (err.code === "28P01") {
    console.error("🔐 Authentication failed! Check these values:", {
      user: dbUser,
      host: dbHost,
      database: dbName,
      passwordLength: dbPassword.length,
      passwordFirstChar: dbPassword[0] || "EMPTY",
      passwordLastChar: dbPassword[dbPassword.length - 1] || "EMPTY",
    });
  }
});

// Handle connection errors and remove bad connections from pool
pool.on("connect", (client) => {
  client.on("error", (err) => {
    console.error("💥 PostgreSQL client error:", err.message);
    if (err.code === "28P01") {
      console.error("🔐 Password authentication failed! The password in your env vars does NOT match what PostgreSQL expects.");
      console.error("💡 Fix: Connect to postgres container and run: ALTER USER postgres WITH PASSWORD 'your_portainer_password';");
    }
  });
});

// Test connection on startup with retry logic
let connectionAttempts = 0;
const maxAttempts = 5;

function testConnection() {
  connectionAttempts++;
  console.log(`🔄 Testing PostgreSQL connection (attempt ${connectionAttempts}/${maxAttempts})...`);
  
  pool.connect()
    .then((client) => {
      console.log("✅ Successfully connected to PostgreSQL");
      client.release();
    })
    .catch((err) => {
      console.error("❌ Failed to connect to PostgreSQL:", {
        message: err.message,
        code: err.code,
        severity: err.severity,
        user: dbUser || "NOT SET",
        host: dbHost || "NOT SET",
        database: dbName || "NOT SET",
        passwordLength: dbPassword?.length || 0,
      });
      
      if (connectionAttempts < maxAttempts) {
        console.log(`⏳ Retrying in 2 seconds...`);
        setTimeout(testConnection, 2000);
      } else {
        console.error("💥 Max connection attempts reached. Check PostgreSQL credentials.");
      }
    });
}

// Start connection test after a short delay to ensure postgres is ready
setTimeout(testConnection, 1000);

const db = drizzle({ client: pool, schema });
export default db;