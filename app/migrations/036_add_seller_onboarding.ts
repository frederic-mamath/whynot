import { Kysely, sql } from "kysely";

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .alterTable("users")
    .addColumn("seller_onboarding_step", "integer", (col) =>
      col.notNull().defaultTo(0),
    )
    .execute();

  await db.schema
    .alterTable("users")
    .addColumn("accepted_seller_rules_at", "timestamptz")
    .execute();

  await db.schema
    .createTable("seller_onboarding_data")
    .addColumn("id", "serial", (col) => col.primaryKey())
    .addColumn("user_id", "integer", (col) =>
      col.notNull().references("users.id").onDelete("cascade").unique(),
    )
    .addColumn("category", "varchar(255)")
    .addColumn("sub_category", "varchar(255)")
    .addColumn("seller_type", "varchar(50)")
    .addColumn("selling_channels", sql`text[]`)
    .addColumn("monthly_revenue_range", "varchar(100)")
    .addColumn("item_count_range", "varchar(100)")
    .addColumn("team_size_range", "varchar(100)")
    .addColumn("live_hours_range", "varchar(100)")
    .addColumn("return_street", "varchar(255)")
    .addColumn("return_city", "varchar(255)")
    .addColumn("return_zip_code", "varchar(100)")
    .addColumn("return_country", "varchar(100)")
    .addColumn("created_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .addColumn("updated_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable("seller_onboarding_data").execute();
  await db.schema
    .alterTable("users")
    .dropColumn("accepted_seller_rules_at")
    .execute();
  await db.schema
    .alterTable("users")
    .dropColumn("seller_onboarding_step")
    .execute();
}
