import { Kysely } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable("user_addresses")
    .addColumn("mondial_relay_point_id", "varchar(50)")
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable("user_addresses")
    .dropColumn("mondial_relay_point_id")
    .execute();
}
