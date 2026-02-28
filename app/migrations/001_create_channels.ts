import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  // Create channels table
  await db.schema
    .createTable('channels')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('name', 'varchar(255)', (col) => col.notNull())
    .addColumn('host_id', 'integer', (col) => col.notNull().references('users.id'))
    .addColumn('status', 'varchar(50)', (col) => col.notNull().defaultTo('active'))
    .addColumn('max_participants', 'integer', (col) => col.defaultTo(10))
    .addColumn('is_private', 'boolean', (col) => col.defaultTo(false))
    .addColumn('created_at', 'timestamp', (col) => col.notNull().defaultTo(sql`now()`))
    .addColumn('ended_at', 'timestamp')
    .execute();

  // Create channel_participants table
  await db.schema
    .createTable('channel_participants')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('channel_id', 'integer', (col) => col.notNull().references('channels.id'))
    .addColumn('user_id', 'integer', (col) => col.notNull().references('users.id'))
    .addColumn('joined_at', 'timestamp', (col) => col.notNull().defaultTo(sql`now()`))
    .addColumn('left_at', 'timestamp')
    .addColumn('role', 'varchar(50)', (col) => col.notNull().defaultTo('audience'))
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('channel_participants').execute();
  await db.schema.dropTable('channels').execute();
}
