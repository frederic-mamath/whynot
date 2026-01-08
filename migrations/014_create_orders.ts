import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  // Create payment status enum
  await db.schema
    .createType('payment_status')
    .asEnum(['pending', 'paid', 'failed', 'refunded'])
    .execute();

  // Create orders table
  await db.schema
    .createTable('orders')
    .addColumn('id', 'uuid', (col) => 
      col.primaryKey().defaultTo(sql`gen_random_uuid()`)
    )
    .addColumn('auction_id', 'uuid', (col) =>
      col.notNull().unique().references('auctions.id').onDelete('restrict')
    )
    .addColumn('buyer_id', 'integer', (col) =>
      col.notNull().references('users.id').onDelete('cascade')
    )
    .addColumn('seller_id', 'integer', (col) =>
      col.notNull().references('users.id').onDelete('cascade')
    )
    .addColumn('product_id', 'integer', (col) =>
      col.notNull().references('products.id').onDelete('cascade')
    )
    .addColumn('final_price', 'decimal', (col) => col.notNull())
    .addColumn('platform_fee', 'decimal', (col) => col.notNull())
    .addColumn('seller_payout', 'decimal', (col) => col.notNull())
    .addColumn('payment_status', sql`payment_status`, (col) =>
      col.notNull().defaultTo('pending')
    )
    .addColumn('payment_deadline', 'timestamptz', (col) => col.notNull())
    .addColumn('stripe_payment_intent_id', 'varchar(255)', (col) => col.unique())
    .addColumn('paid_at', 'timestamptz')
    .addColumn('shipped_at', 'timestamptz')
    .addColumn('created_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn('updated_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .execute();

  // Add check constraint for positive final price
  await db.schema
    .alterTable('orders')
    .addCheckConstraint('orders_final_price_check', sql`final_price > 0`)
    .execute();

  // Add check constraint for platform fee (7%)
  await db.schema
    .alterTable('orders')
    .addCheckConstraint(
      'orders_platform_fee_check',
      sql`platform_fee = ROUND(final_price * 0.07, 2)`
    )
    .execute();

  // Add check constraint for seller payout (93%)
  await db.schema
    .alterTable('orders')
    .addCheckConstraint(
      'orders_seller_payout_check',
      sql`seller_payout = ROUND(final_price * 0.93, 2)`
    )
    .execute();

  // Create indexes for common queries
  await db.schema
    .createIndex('orders_buyer_id_idx')
    .on('orders')
    .column('buyer_id')
    .execute();

  await db.schema
    .createIndex('orders_seller_id_idx')
    .on('orders')
    .column('seller_id')
    .execute();

  await db.schema
    .createIndex('orders_payment_deadline_idx')
    .on('orders')
    .column('payment_deadline')
    .execute();

  // Composite index for pending deliveries (seller view)
  await db.schema
    .createIndex('orders_seller_id_payment_status_idx')
    .on('orders')
    .columns(['seller_id', 'payment_status'])
    .execute();

  // Composite index for my orders (buyer view)
  await db.schema
    .createIndex('orders_buyer_id_payment_status_idx')
    .on('orders')
    .columns(['buyer_id', 'payment_status'])
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('orders').execute();
  await db.schema.dropType('payment_status').execute();
}
