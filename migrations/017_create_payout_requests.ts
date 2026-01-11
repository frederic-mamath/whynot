import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  // Create payout request status enum
  await db.schema
    .createType('payout_status')
    .asEnum(['pending', 'approved', 'paid', 'rejected'])
    .execute();

  // Create payout_requests table
  await db.schema
    .createTable('payout_requests')
    .addColumn('id', 'uuid', (col) => 
      col.primaryKey().defaultTo(sql`gen_random_uuid()`)
    )
    .addColumn('seller_id', 'integer', (col) =>
      col.notNull().references('users.id').onDelete('cascade')
    )
    .addColumn('order_id', 'uuid', (col) =>
      col.notNull().unique().references('orders.id').onDelete('restrict')
    )
    .addColumn('amount', 'decimal', (col) => col.notNull())
    .addColumn('status', sql`payout_status`, (col) =>
      col.notNull().defaultTo('pending')
    )
    .addColumn('payment_method', 'varchar(50)')
    .addColumn('payment_details', 'text')
    .addColumn('processed_at', 'timestamptz')
    .addColumn('processed_by', 'integer', (col) =>
      col.references('users.id').onDelete('set null')
    )
    .addColumn('rejection_reason', 'text')
    .addColumn('created_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn('updated_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .execute();

  // Create indexes
  await db.schema
    .createIndex('payout_requests_seller_id_idx')
    .on('payout_requests')
    .column('seller_id')
    .execute();

  await db.schema
    .createIndex('payout_requests_status_idx')
    .on('payout_requests')
    .column('status')
    .execute();

  // Add check constraint for positive amount
  await db.schema
    .alterTable('payout_requests')
    .addCheckConstraint('payout_requests_amount_check', sql`amount > 0`)
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('payout_requests').execute();
  await db.schema.dropType('payout_status').execute();
}
