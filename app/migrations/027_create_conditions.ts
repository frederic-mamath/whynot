import { Kysely, sql } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable("conditions")
    .addColumn("id", "serial", (col) => col.primaryKey())
    .addColumn("name", "varchar(100)", (col) => col.notNull())
    .addColumn("position", "integer", (col) => col.notNull().defaultTo(0))
    .addColumn("created_at", "timestamp", (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .execute();

  // Seed conditions
  await db
    .insertInto("conditions")
    .values([
      { name: "Neuf", position: 0 },
      { name: "Très bon", position: 1 },
      { name: "Bon", position: 2 },
      { name: "Correct", position: 3 },
    ])
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable("conditions").execute();
}
