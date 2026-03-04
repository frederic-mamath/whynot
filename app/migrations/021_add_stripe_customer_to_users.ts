import { Kysely } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  // Add Stripe Customer ID for buyers (distinct from stripe_account_id which is for Connect sellers)
  await db.schema
    .alterTable("users")
    .addColumn("stripe_customer_id", "varchar(255)", (col) => col.unique())
    .execute();

  // Create index for Stripe customer lookups
  await db.schema
    .createIndex("users_stripe_customer_id_idx")
    .on("users")
    .column("stripe_customer_id")
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropIndex("users_stripe_customer_id_idx").execute();

  await db.schema
    .alterTable("users")
    .dropColumn("stripe_customer_id")
    .execute();
}
