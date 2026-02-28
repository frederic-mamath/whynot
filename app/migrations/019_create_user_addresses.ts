import { Kysely, sql } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable("user_addresses")
    .addColumn("id", "serial", (col) => col.primaryKey())
    .addColumn("user_id", "integer", (col) =>
      col.references("users.id").onDelete("cascade").notNull(),
    )
    .addColumn("label", "varchar(100)", (col) => col.notNull())
    .addColumn("street", "varchar(255)", (col) => col.notNull())
    .addColumn("street2", "varchar(255)")
    .addColumn("city", "varchar(100)", (col) => col.notNull())
    .addColumn("state", "varchar(100)", (col) => col.notNull())
    .addColumn("zip_code", "varchar(20)", (col) => col.notNull())
    .addColumn("country", "varchar(2)", (col) => col.notNull().defaultTo("US"))
    .addColumn("is_default", "boolean", (col) => col.notNull().defaultTo(false))
    .addColumn("created_at", "timestamp", (col) =>
      col.defaultTo(sql`CURRENT_TIMESTAMP`).notNull(),
    )
    .addColumn("updated_at", "timestamp", (col) =>
      col.defaultTo(sql`CURRENT_TIMESTAMP`).notNull(),
    )
    .execute();

  // Create index for faster user lookups
  await db.schema
    .createIndex("user_addresses_user_id_idx")
    .on("user_addresses")
    .column("user_id")
    .execute();

  // Create unique index to ensure only one default address per user
  await db.schema
    .createIndex("user_addresses_user_id_is_default_idx")
    .on("user_addresses")
    .columns(["user_id", "is_default"])
    .where("is_default", "=", true)
    .unique()
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable("user_addresses").execute();
}
