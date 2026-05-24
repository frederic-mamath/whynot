import { Kysely, sql } from "kysely";

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable("live_product_interests")
    .addColumn("id", "serial", (col) => col.primaryKey())
    .addColumn("buyer_id", "integer", (col) =>
      col.notNull().references("users.id").onDelete("cascade"),
    )
    .addColumn("product_id", "integer", (col) =>
      col.notNull().references("products.id").onDelete("cascade"),
    )
    .addColumn("live_id", "integer", (col) =>
      col.notNull().references("lives.id").onDelete("cascade"),
    )
    .addColumn("created_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .execute();

  await db.schema
    .createIndex("live_product_interests_unique")
    .unique()
    .on("live_product_interests")
    .columns(["buyer_id", "product_id", "live_id"])
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable("live_product_interests").execute();
}
