import { Kysely, sql } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable("categories")
    .addColumn("id", "serial", (col) => col.primaryKey())
    .addColumn("name", "varchar(100)", (col) => col.notNull())
    .addColumn("emoji", "varchar(10)")
    .addColumn("position", "integer", (col) => col.notNull().defaultTo(0))
    .addColumn("created_at", "timestamp", (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .execute();

  // Seed categories
  await db
    .insertInto("categories")
    .values([
      { name: "Mode", emoji: "👗", position: 0 },
      { name: "Sneakers", emoji: "👟", position: 1 },
      { name: "Bijoux", emoji: "💍", position: 2 },
      { name: "Vintage", emoji: "📦", position: 3 },
      { name: "Tech", emoji: "📱", position: 4 },
      { name: "Art", emoji: "🎨", position: 5 },
    ])
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable("categories").execute();
}
