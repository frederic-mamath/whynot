import { Kysely } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('channels')
    .addColumn('highlighted_product_id', 'integer', (col) =>
      col.references('products.id').onDelete('set null')
    )
    .addColumn('highlighted_at', 'timestamp')
    .execute();

  // Add index for querying highlighted products
  await db.schema
    .createIndex('channels_highlighted_product_id_idx')
    .on('channels')
    .column('highlighted_product_id')
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('channels')
    .dropColumn('highlighted_product_id')
    .dropColumn('highlighted_at')
    .execute();
}
