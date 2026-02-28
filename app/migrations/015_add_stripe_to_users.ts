import { Kysely } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  // Add Stripe account fields to users table
  await db.schema
    .alterTable('users')
    .addColumn('stripe_account_id', 'varchar(255)', (col) => col.unique())
    .execute();

  await db.schema
    .alterTable('users')
    .addColumn('stripe_onboarding_complete', 'boolean', (col) =>
      col.notNull().defaultTo(false)
    )
    .execute();

  // Create index for Stripe account lookups
  await db.schema
    .createIndex('users_stripe_account_id_idx')
    .on('users')
    .column('stripe_account_id')
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('users')
    .dropColumn('stripe_account_id')
    .execute();

  await db.schema
    .alterTable('users')
    .dropColumn('stripe_onboarding_complete')
    .execute();
}
