import { Kysely } from "kysely";

/**
 * Migration: Add Agora Cloud Recording fields to channels table
 * Adds fields to track cloud recording state and metadata
 */
export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable("channels")
    .addColumn("agora_resource_id", "varchar(100)") // Agora Cloud Recording Resource ID
    .addColumn("agora_sid", "varchar(100)") // Agora Cloud Recording Session ID
    .addColumn("agora_recording_uid", "integer") // UID used by recording bot
    .addColumn("relay_status", "varchar(20)") // "starting", "active", "stopped", "error"
    .addColumn("relay_started_at", "timestamp") // When relay started
    .execute();

  // Create index for faster relay status queries
  await db.schema
    .createIndex("idx_channels_relay_status")
    .on("channels")
    .column("relay_status")
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .dropIndex("idx_channels_relay_status")
    .on("channels")
    .execute();

  await db.schema
    .alterTable("channels")
    .dropColumn("agora_resource_id")
    .dropColumn("agora_sid")
    .dropColumn("agora_recording_uid")
    .dropColumn("relay_status")
    .dropColumn("relay_started_at")
    .execute();
}
