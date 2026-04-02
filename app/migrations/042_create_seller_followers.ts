import { Kysely, sql } from "kysely";

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable("seller_followers")
    .addColumn("follower_id", "integer", (col) =>
      col.notNull().references("users.id").onDelete("cascade"),
    )
    .addColumn("seller_id", "integer", (col) =>
      col.notNull().references("users.id").onDelete("cascade"),
    )
    .addColumn("created_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .addPrimaryKeyConstraint("seller_followers_pkey", [
      "follower_id",
      "seller_id",
    ])
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable("seller_followers").execute();
}
