import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  // Create bids table
  await db.schema
    .createTable('bids')
    .addColumn('id', 'uuid', (col) => 
      col.primaryKey().defaultTo(sql`gen_random_uuid()`)
    )
    .addColumn('auction_id', 'uuid', (col) =>
      col.notNull().references('auctions.id').onDelete('cascade')
    )
    .addColumn('bidder_id', 'integer', (col) =>
      col.notNull().references('users.id').onDelete('cascade')
    )
    .addColumn('amount', 'decimal', (col) => col.notNull())
    .addColumn('placed_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn('created_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .execute();

  // Add check constraint for positive amounts
  await db.schema
    .alterTable('bids')
    .addCheckConstraint('bids_amount_check', sql`amount > 0`)
    .execute();

  // Create index for bid history (DESC order for latest first)
  await db.schema
    .createIndex('bids_auction_id_placed_at_idx')
    .on('bids')
    .columns(['auction_id', 'placed_at'])
    .execute();

  // Create index for user's bid history
  await db.schema
    .createIndex('bids_bidder_id_idx')
    .on('bids')
    .column('bidder_id')
    .execute();

  // Composite index for finding highest bid efficiently
  await db.schema
    .createIndex('bids_auction_id_amount_idx')
    .on('bids')
    .columns(['auction_id', 'amount'])
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('bids').execute();
}
