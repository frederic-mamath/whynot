import { Kysely, sql } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  // Add is_active and started_at fields to channels table
  await db.schema
    .alterTable("channels")
    .addColumn("is_active", "boolean", (col) => col.defaultTo(false).notNull())
    .execute();

  await db.schema
    .alterTable("channels")
    .addColumn("started_at", "timestamp")
    .execute();

  // Set is_active to true for existing channels with status = 'active'
  await sql`UPDATE channels SET is_active = true WHERE status = 'active'`.execute(
    db,
  );
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.alterTable("channels").dropColumn("started_at").execute();
  await db.schema.alterTable("channels").dropColumn("is_active").execute();
}
