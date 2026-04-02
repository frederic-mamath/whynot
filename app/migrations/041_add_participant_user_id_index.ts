import { Kysely } from "kysely";

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createIndex("live_participants_user_id_idx")
    .on("live_participants")
    .column("user_id")
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .dropIndex("live_participants_user_id_idx")
    .execute();
}
