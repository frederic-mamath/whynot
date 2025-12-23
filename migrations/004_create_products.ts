import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('products')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('shop_id', 'integer', (col) => 
      col.notNull().references('shops.id').onDelete('cascade')
    )
    .addColumn('name', 'varchar(255)', (col) => col.notNull())
    .addColumn('description', 'text')
    .addColumn('price', 'decimal')
    .addColumn('image_url', 'varchar(500)')
    .addColumn('is_active', 'boolean', (col) => col.notNull().defaultTo(true))
    .addColumn('created_at', 'timestamp', (col) => 
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn('updated_at', 'timestamp', (col) => 
      col.notNull().defaultTo(sql`now()`)
    )
    .execute();

  // Index for faster shop product lookups
  await db.schema
    .createIndex('products_shop_id_idx')
    .on('products')
    .column('shop_id')
    .execute();

  // Index for filtering active products
  await db.schema
    .createIndex('products_is_active_idx')
    .on('products')
    .column('is_active')
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('products').execute();
}
