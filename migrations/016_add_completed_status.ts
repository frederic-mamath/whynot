import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  // Add 'completed' to auction_status enum
  await sql`ALTER TYPE auction_status ADD VALUE 'completed'`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  // Note: PostgreSQL doesn't support removing enum values directly
  // Would need to recreate the type and update all references
  // For now, this migration is not reversible
}
