import { Kysely } from "kysely";

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema.alterTable("lives").dropColumn("status").execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .alterTable("lives")
    .addColumn("status", "varchar(50)", (col) =>
      col.notNull().defaultTo("active"),
    )
    .execute();
}
