import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  // Create auction status enum
  await db.schema
    .createType('auction_status')
    .asEnum(['active', 'ended', 'paid', 'cancelled'])
    .execute();

  // Create auctions table
  await db.schema
    .createTable('auctions')
    .addColumn('id', 'uuid', (col) => 
      col.primaryKey().defaultTo(sql`gen_random_uuid()`)
    )
    .addColumn('product_id', 'integer', (col) =>
      col.notNull().references('products.id').onDelete('cascade')
    )
    .addColumn('seller_id', 'integer', (col) =>
      col.notNull().references('users.id').onDelete('cascade')
    )
    .addColumn('channel_id', 'integer', (col) =>
      col.notNull().references('channels.id').onDelete('cascade')
    )
    .addColumn('starting_price', 'decimal', (col) => col.notNull())
    .addColumn('buyout_price', 'decimal')
    .addColumn('current_bid', 'decimal', (col) => col.notNull())
    .addColumn('highest_bidder_id', 'integer', (col) =>
      col.references('users.id').onDelete('set null')
    )
    .addColumn('duration_seconds', 'integer', (col) => col.notNull())
    .addColumn('started_at', 'timestamptz', (col) => col.notNull())
    .addColumn('ends_at', 'timestamptz', (col) => col.notNull())
    .addColumn('extended_count', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('status', sql`auction_status`, (col) => col.notNull().defaultTo('active'))
    .addColumn('created_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn('updated_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .execute();

  // Add check constraints
  await db.schema
    .alterTable('auctions')
    .addCheckConstraint(
      'auctions_buyout_price_check',
      sql`buyout_price IS NULL OR buyout_price > starting_price`
    )
    .execute();

  await db.schema
    .alterTable('auctions')
    .addCheckConstraint(
      'auctions_current_bid_check',
      sql`current_bid >= starting_price`
    )
    .execute();

  await db.schema
    .alterTable('auctions')
    .addCheckConstraint(
      'auctions_duration_check',
      sql`duration_seconds IN (60, 300, 600, 1800)`
    )
    .execute();

  await db.schema
    .alterTable('auctions')
    .addCheckConstraint(
      'auctions_ends_at_check',
      sql`ends_at > started_at`
    )
    .execute();

  // Create indexes for performance
  await db.schema
    .createIndex('auctions_channel_id_idx')
    .on('auctions')
    .column('channel_id')
    .execute();

  await db.schema
    .createIndex('auctions_status_idx')
    .on('auctions')
    .column('status')
    .execute();

  await db.schema
    .createIndex('auctions_seller_id_idx')
    .on('auctions')
    .column('seller_id')
    .execute();

  await db.schema
    .createIndex('auctions_ends_at_idx')
    .on('auctions')
    .column('ends_at')
    .execute();

  // Composite index for finding active auctions by channel
  await db.schema
    .createIndex('auctions_channel_id_status_idx')
    .on('auctions')
    .columns(['channel_id', 'status'])
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('auctions').execute();
  await db.schema.dropType('auction_status').execute();
}
