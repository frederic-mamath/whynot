import { Kysely, sql } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable("product_images")
    .addColumn("id", "serial", (col) => col.primaryKey())
    .addColumn("product_id", "integer", (col) =>
      col.notNull().references("products.id").onDelete("cascade"),
    )
    .addColumn("url", "text", (col) => col.notNull())
    .addColumn("cloudinary_public_id", "varchar(255)")
    .addColumn("position", "integer", (col) => col.notNull().defaultTo(0))
    .addColumn("created_at", "timestamp", (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .execute();

  // Index for faster product image lookups
  await db.schema
    .createIndex("product_images_product_id_idx")
    .on("product_images")
    .column("product_id")
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable("product_images").execute();
}
