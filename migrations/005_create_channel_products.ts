import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('channel_products')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('channel_id', 'integer', (col) => 
      col.notNull().references('channels.id').onDelete('cascade')
    )
    .addColumn('product_id', 'integer', (col) => 
      col.notNull().references('products.id').onDelete('cascade')
    )
    .addColumn('created_at', 'timestamp', (col) => 
      col.notNull().defaultTo(sql`now()`)
    )
    .execute();

  // Unique constraint: product can be associated only once per channel
  await db.schema
    .createIndex('channel_products_unique_idx')
    .on('channel_products')
    .columns(['channel_id', 'product_id'])
    .unique()
    .execute();

  // Index for faster channel product lookups
  await db.schema
    .createIndex('channel_products_channel_id_idx')
    .on('channel_products')
    .column('channel_id')
    .execute();

  // Index for finding channels by product
  await db.schema
    .createIndex('channel_products_product_id_idx')
    .on('channel_products')
    .column('product_id')
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('channel_products').execute();
}
