import { Kysely } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('users')
    .addColumn('firstname', 'varchar(255)')
    .addColumn('lastname', 'varchar(255)')
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('users')
    .dropColumn('firstname')
    .dropColumn('lastname')
    .execute();
}
