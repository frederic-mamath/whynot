import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('roles')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('name', 'varchar(50)', (col) => col.notNull().unique())
    .addColumn('created_at', 'timestamp', (col) => 
      col.notNull().defaultTo(sql`now()`)
    )
    .execute();

  await db
    .insertInto('roles')
    .values([
      { name: 'BUYER' },
      { name: 'SELLER' },
    ])
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('roles').execute();
}
