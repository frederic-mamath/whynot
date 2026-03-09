import { Kysely } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable("products")
    .addColumn("starting_price", "decimal")
    .execute();

  await db.schema
    .alterTable("products")
    .addColumn("wished_price", "decimal")
    .execute();

  await db.schema
    .alterTable("products")
    .addColumn("category_id", "integer", (col) =>
      col.references("categories.id").onDelete("set null"),
    )
    .execute();

  await db.schema
    .alterTable("products")
    .addColumn("condition_id", "integer", (col) =>
      col.references("conditions.id").onDelete("set null"),
    )
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.alterTable("products").dropColumn("condition_id").execute();

  await db.schema.alterTable("products").dropColumn("category_id").execute();

  await db.schema.alterTable("products").dropColumn("wished_price").execute();

  await db.schema.alterTable("products").dropColumn("starting_price").execute();
}
