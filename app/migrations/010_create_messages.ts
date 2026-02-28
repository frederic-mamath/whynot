import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  // Create messages table
  await db.schema
    .createTable('messages')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('channel_id', 'integer', (col) => 
      col.notNull().references('channels.id').onDelete('cascade')
    )
    .addColumn('user_id', 'integer', (col) => 
      col.notNull().references('users.id').onDelete('cascade')
    )
    .addColumn('content', 'varchar(500)', (col) => col.notNull())
    .addColumn('created_at', 'timestamp', (col) => 
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn('deleted_at', 'timestamp')
    .execute();

  // Create index for efficient queries by channel and time
  await db.schema
    .createIndex('messages_channel_id_created_at_idx')
    .on('messages')
    .columns(['channel_id', 'created_at'])
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('messages').execute();
}
