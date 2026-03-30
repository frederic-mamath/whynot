import { Kysely, sql } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable("packages")
    .addColumn("id", "uuid", (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn("buyer_id", "integer", (col) =>
      col.notNull().references("users.id").onDelete("cascade"),
    )
    .addColumn("seller_id", "integer", (col) =>
      col.notNull().references("users.id").onDelete("cascade"),
    )
    .addColumn("live_id", "integer", (col) =>
      col.notNull().references("lives.id").onDelete("restrict"),
    )
    .addColumn("tracking_number", "varchar(50)")
    .addColumn("label_url", "text")
    .addColumn("weight_grams", "integer")
    .addColumn("mondial_relay_point_id", "varchar(50)")
    .addColumn("status", "varchar(20)", (col) =>
      col.notNull().defaultTo("pending"),
    )
    .addColumn("delivered_at", "timestamptz")
    .addColumn("created_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .addColumn("updated_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .execute();

  await db.schema
    .createIndex("packages_buyer_seller_live_unique_idx")
    .on("packages")
    .columns(["buyer_id", "seller_id", "live_id"])
    .unique()
    .execute();

  await db.schema
    .createIndex("packages_seller_id_idx")
    .on("packages")
    .column("seller_id")
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable("packages").execute();
}
