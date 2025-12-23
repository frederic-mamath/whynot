import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('vendor_promoted_products')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('channel_id', 'integer', (col) => 
      col.notNull().references('channels.id').onDelete('cascade')
    )
    .addColumn('vendor_id', 'integer', (col) => 
      col.notNull().references('users.id').onDelete('cascade')
    )
    .addColumn('product_id', 'integer', (col) => 
      col.notNull().references('products.id').onDelete('cascade')
    )
    .addColumn('promoted_at', 'timestamp', (col) => 
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn('unpromoted_at', 'timestamp')
    .execute();

  // Index for finding active promotions
  await db.schema
    .createIndex('vendor_promoted_products_active_idx')
    .on('vendor_promoted_products')
    .columns(['channel_id', 'unpromoted_at'])
    .execute();

  // Index for vendor's promotions
  await db.schema
    .createIndex('vendor_promoted_products_vendor_id_idx')
    .on('vendor_promoted_products')
    .column('vendor_id')
    .execute();

  // Index for product promotion history
  await db.schema
    .createIndex('vendor_promoted_products_product_id_idx')
    .on('vendor_promoted_products')
    .column('product_id')
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('vendor_promoted_products').execute();
}
