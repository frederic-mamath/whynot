import { Kysely } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable("stream_metrics")
    .addColumn("id", "serial", (col) => col.primaryKey())
    .addColumn("channel_id", "integer", (col) =>
      col.references("channels.id").onDelete("cascade").notNull(),
    )
    .addColumn("timestamp", "timestamp", (col) =>
      col.defaultTo(db.fn("now")).notNull(),
    )
    .addColumn("relay_status", "varchar(20)") // "starting", "active", "stopped", "error"
    .addColumn("is_live", "boolean", (col) => col.defaultTo(false))
    .addColumn("hls_viewers", "integer", (col) => col.defaultTo(0))
    .addColumn("duration_seconds", "integer", (col) => col.defaultTo(0))
    .addColumn("cloudflare_stream_id", "varchar(100)")
    .addColumn("created_at", "timestamp", (col) =>
      col.defaultTo(db.fn("now")).notNull(),
    )
    .execute();

  // Index for faster queries
  await db.schema
    .createIndex("idx_stream_metrics_channel_timestamp")
    .on("stream_metrics")
    .columns(["channel_id", "timestamp"])
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable("stream_metrics").execute();
}
