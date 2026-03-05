import { Kysely, sql } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable("auth_providers")
    .addColumn("id", "serial", (col) => col.primaryKey())
    .addColumn("user_id", "integer", (col) =>
      col.notNull().references("users.id").onDelete("cascade"),
    )
    .addColumn("provider", "varchar(50)", (col) => col.notNull())
    .addColumn("provider_user_id", "varchar(255)", (col) => col.notNull())
    .addColumn("provider_email", "varchar(255)")
    .addColumn("created_at", "timestamp", (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .execute();

  await db.schema
    .createIndex("auth_providers_provider_user_id_unique")
    .on("auth_providers")
    .columns(["provider", "provider_user_id"])
    .unique()
    .execute();

  await db.schema
    .createIndex("auth_providers_user_id_idx")
    .on("auth_providers")
    .column("user_id")
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable("auth_providers").execute();
}
