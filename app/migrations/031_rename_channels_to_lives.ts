import { Kysely, sql } from "kysely";

export async function up(db: Kysely<unknown>): Promise<void> {
  // 1. Rename tables
  await sql`ALTER TABLE channels RENAME TO lives`.execute(db);
  await sql`ALTER TABLE channel_participants RENAME TO live_participants`.execute(
    db,
  );
  await sql`ALTER TABLE channel_products RENAME TO live_products`.execute(db);

  // 2. Rename channel_id columns in the renamed tables
  await sql`ALTER TABLE live_participants RENAME COLUMN channel_id TO live_id`.execute(
    db,
  );
  await sql`ALTER TABLE live_products RENAME COLUMN channel_id TO live_id`.execute(
    db,
  );

  // 3. Add new scheduling columns to lives
  await sql`ALTER TABLE lives ADD COLUMN starts_at TIMESTAMP`.execute(db);
  await sql`UPDATE lives SET starts_at = created_at`.execute(db);
  await sql`ALTER TABLE lives ALTER COLUMN starts_at SET NOT NULL`.execute(db);

  await sql`ALTER TABLE lives ADD COLUMN ends_at TIMESTAMP`.execute(db);
  await sql`ALTER TABLE lives ADD COLUMN session_stopped_at TIMESTAMP`.execute(
    db,
  );
  await sql`ALTER TABLE lives ADD COLUMN description TEXT`.execute(db);

  // 4. Update indexes (rename if they exist)
  await sql`
    DO $$
    BEGIN
      IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_channel_participants_channel_id') THEN
        ALTER INDEX idx_channel_participants_channel_id RENAME TO idx_live_participants_live_id;
      END IF;
    END $$;
  `.execute(db);

  await sql`
    DO $$
    BEGIN
      IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_channel_products_channel_id') THEN
        ALTER INDEX idx_channel_products_channel_id RENAME TO idx_live_products_live_id;
      END IF;
    END $$;
  `.execute(db);
}

export async function down(db: Kysely<unknown>): Promise<void> {
  // Remove new columns
  await sql`ALTER TABLE lives DROP COLUMN IF EXISTS description`.execute(db);
  await sql`ALTER TABLE lives DROP COLUMN IF EXISTS session_stopped_at`.execute(
    db,
  );
  await sql`ALTER TABLE lives DROP COLUMN IF EXISTS ends_at`.execute(db);
  await sql`ALTER TABLE lives DROP COLUMN IF EXISTS starts_at`.execute(db);

  // Rename columns back
  await sql`ALTER TABLE live_participants RENAME COLUMN live_id TO channel_id`.execute(
    db,
  );
  await sql`ALTER TABLE live_products RENAME COLUMN live_id TO channel_id`.execute(
    db,
  );

  // Rename tables back
  await sql`ALTER TABLE live_products RENAME TO channel_products`.execute(db);
  await sql`ALTER TABLE live_participants RENAME TO channel_participants`.execute(
    db,
  );
  await sql`ALTER TABLE lives RENAME TO channels`.execute(db);
}
