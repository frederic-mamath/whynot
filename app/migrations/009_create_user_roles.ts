import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('user_roles')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('user_id', 'integer', (col) => 
      col.notNull().references('users.id').onDelete('cascade')
    )
    .addColumn('role_id', 'integer', (col) => 
      col.notNull().references('roles.id').onDelete('cascade')
    )
    .addColumn('activated_by', 'integer', (col) => 
      col.references('users.id').onDelete('set null')
    )
    .addColumn('activated_at', 'timestamp')
    .addColumn('created_at', 'timestamp', (col) => 
      col.notNull().defaultTo(sql`now()`)
    )
    .execute();

  await db.schema
    .createIndex('user_roles_unique_idx')
    .on('user_roles')
    .columns(['user_id', 'role_id'])
    .unique()
    .execute();

  await db.schema
    .createIndex('user_roles_user_id_idx')
    .on('user_roles')
    .column('user_id')
    .execute();

  await db.schema
    .createIndex('user_roles_role_id_idx')
    .on('user_roles')
    .column('role_id')
    .execute();

  const buyerRole = await db
    .selectFrom('roles')
    .select('id')
    .where('name', '=', 'BUYER')
    .executeTakeFirst();

  if (buyerRole) {
    await db
      .insertInto('user_roles')
      .columns(['user_id', 'role_id', 'activated_at'])
      .expression(
        db
          .selectFrom('users')
          .select([
            'id as user_id',
            sql`${buyerRole.id}`.as('role_id'),
            sql`now()`.as('activated_at')
          ])
      )
      .execute();
  }
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('user_roles').execute();
}
