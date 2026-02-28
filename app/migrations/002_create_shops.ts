import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('shops')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('name', 'varchar(255)', (col) => col.notNull())
    .addColumn('description', 'text')
    .addColumn('owner_id', 'integer', (col) => 
      col.notNull().references('users.id').onDelete('cascade')
    )
    .addColumn('created_at', 'timestamp', (col) => 
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn('updated_at', 'timestamp', (col) => 
      col.notNull().defaultTo(sql`now()`)
    )
    .execute();

  // Index for faster owner lookups
  await db.schema
    .createIndex('shops_owner_id_idx')
    .on('shops')
    .column('owner_id')
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('shops').execute();
}
