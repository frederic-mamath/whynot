import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('user_shop_roles')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('user_id', 'integer', (col) => 
      col.notNull().references('users.id').onDelete('cascade')
    )
    .addColumn('shop_id', 'integer', (col) => 
      col.notNull().references('shops.id').onDelete('cascade')
    )
    .addColumn('role', 'varchar(50)', (col) => col.notNull())
    .addColumn('created_at', 'timestamp', (col) => 
      col.notNull().defaultTo(sql`now()`)
    )
    .execute();

  // Unique constraint: user can have each role only once per shop
  await db.schema
    .createIndex('user_shop_roles_unique_idx')
    .on('user_shop_roles')
    .columns(['user_id', 'shop_id', 'role'])
    .unique()
    .execute();

  // Index for faster shop role lookups
  await db.schema
    .createIndex('user_shop_roles_shop_id_idx')
    .on('user_shop_roles')
    .column('shop_id')
    .execute();

  // Index for faster user role lookups
  await db.schema
    .createIndex('user_shop_roles_user_id_idx')
    .on('user_shop_roles')
    .column('user_id')
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('user_shop_roles').execute();
}
