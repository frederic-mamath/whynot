import { Kysely } from "kysely";

/**
 * Migration: Add Cloudflare Stream fields to channels table
 * Adds fields to track HLS playback and stream metadata
 */
export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable("channels")
    .addColumn("stream_key_id", "varchar(100)") // Cloudflare Live Input UID
    .addColumn("hls_playback_url", "varchar(500)") // HLS URL for buyers
    .addColumn("stream_recording_url", "varchar(500)") // VOD URL (after stream)
    .execute();

  // Index for faster lookups by stream key
  await db.schema
    .createIndex("idx_channels_stream_key_id")
    .on("channels")
    .column("stream_key_id")
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .dropIndex("idx_channels_stream_key_id")
    .on("channels")
    .execute();

  await db.schema
    .alterTable("channels")
    .dropColumn("stream_key_id")
    .dropColumn("hls_playback_url")
    .dropColumn("stream_recording_url")
    .execute();
}
