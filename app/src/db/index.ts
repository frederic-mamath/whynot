import { Kysely, PostgresDialect } from "kysely";
import { Pool } from "pg";
import { Database } from "./types";

import * as dotenv from "dotenv";

dotenv.config();

// Support DATABASE_URL (Render) or individual DB_ params (local / docker-compose)
const getDatabaseUrl = () => {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }
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
  connectionString: getDatabaseUrl(),
  // Render managed databases require SSL in production
  ssl: isProduction
    ? {
        rejectUnauthorized: false,
      }
    : false,
  max: 10,
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
