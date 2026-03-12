import { Kysely, sql } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable("users")
    .addColumn("avatar_url", "varchar(500)", (col) => col.defaultTo(null))
    .execute();

  await db.schema
    .alterTable("users")
    .addColumn("has_completed_onboarding", "boolean", (col) =>
      col.notNull().defaultTo(false),
    )
    .execute();

  // Mark existing users as having completed onboarding to avoid regression
  await sql`UPDATE users SET has_completed_onboarding = true`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable("users")
    .dropColumn("has_completed_onboarding")
    .execute();

  await db.schema.alterTable("users").dropColumn("avatar_url").execute();
}
