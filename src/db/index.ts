import { Kysely, PostgresDialect } from "kysely";
import { Pool } from "pg";
import { Database } from "./types";

import * as dotenv from "dotenv";

dotenv.config();

// Build connection string from individual params
const buildDatabaseUrl = () => {
  const host = process.env.DB_HOST || "localhost";
  const port = process.env.DB_PORT || "5432";
  const database = process.env.DB_NAME || "whynot";
  const user = process.env.DB_USER || "postgres";
  const password = process.env.DB_PASSWORD || "postgres";

  return `postgres://${user}:${password}@${host}:${port}/${database}`;
};

const isProduction = process.env.NODE_ENV === "production";
console.log(
  `📊 Database mode: ${isProduction ? "PRODUCTION (SSL enabled)" : "DEVELOPMENT (SSL disabled)"}`,
);

const pool = new Pool({
  connectionString: buildDatabaseUrl(),
  // Only use SSL in production (Heroku requires it)
  ssl: isProduction
    ? {
        rejectUnauthorized: false,
      }
    : false,
  max: 10, // Connection pool size
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on("error", (err) => {
  console.error("Unexpected database error:", err);
});

pool.connect((err, client, release) => {
  if (err) {
    console.error("Error connecting to database:", err);
  } else {
    console.log("Database connected successfully");
    release();
  }
});

export const db = new Kysely<Database>({
  dialect: new PostgresDialect({
    pool,
  }),
});

export type { Database } from "./types";
