import { Kysely, sql } from "kysely";

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .alterTable("users")
    .addColumn("accepted_cgu_at", "timestamp")
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.alterTable("users").dropColumn("accepted_cgu_at").execute();
}
