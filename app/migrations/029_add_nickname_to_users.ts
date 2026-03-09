import { Kysely, sql } from "kysely";

export async function up(db: Kysely<unknown>): Promise<void> {
  // Add nullable first, then backfill, then make NOT NULL
  await db.schema
    .alterTable("users")
    .addColumn("nickname", "varchar(50)")
    .execute();

  // Backfill from email prefix
  await sql`
    UPDATE users SET nickname = LOWER(SPLIT_PART(email, '@', 1))
    WHERE nickname IS NULL
  `.execute(db);

  // Make NOT NULL
  await sql`ALTER TABLE users ALTER COLUMN nickname SET NOT NULL`.execute(db);

  // Add unique constraint
  await sql`
    ALTER TABLE users ADD CONSTRAINT users_nickname_unique UNIQUE (nickname)
  `.execute(db);
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await sql`
    ALTER TABLE users DROP CONSTRAINT IF EXISTS users_nickname_unique
  `.execute(db);

  await db.schema.alterTable("users").dropColumn("nickname").execute();
}
