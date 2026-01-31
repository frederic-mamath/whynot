import { Kysely, sql } from "kysely";

/**
 * Migration 025: Increase agora_resource_id column length
 *
 * Agora Cloud Recording resource IDs can exceed 200 characters.
 * Increase from VARCHAR(100) to VARCHAR(500) to accommodate them.
 */
export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable("channels")
    .alterColumn("agora_resource_id", (col) =>
      col.setDataType(sql`VARCHAR(500)`),
    )
    .execute();

  console.log("✅ Migration 025: Increased agora_resource_id to VARCHAR(500)");
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable("channels")
    .alterColumn("agora_resource_id", (col) =>
      col.setDataType(sql`VARCHAR(100)`),
    )
    .execute();

  console.log(
    "⬇️  Migration 025 rolled back: Reverted agora_resource_id to VARCHAR(100)",
  );
}
