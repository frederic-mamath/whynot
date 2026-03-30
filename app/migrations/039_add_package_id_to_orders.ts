import { Kysely } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable("orders")
    .addColumn("package_id", "uuid", (col) =>
      col.references("packages.id").onDelete("set null"),
    )
    .execute();

  await db.schema
    .createIndex("orders_package_id_idx")
    .on("orders")
    .column("package_id")
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.alterTable("orders").dropColumn("package_id").execute();
}
