import { Kysely } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable("cost_records")
    .addColumn("id", "serial", (col) => col.primaryKey())
    .addColumn("channel_id", "integer", (col) =>
      col.references("channels.id").onDelete("cascade").notNull(),
    )
    .addColumn("service", "varchar(50)", (col) => col.notNull()) // "agora", "cloudflare", "cdn"
    .addColumn("cost_type", "varchar(50)", (col) => col.notNull()) // "streaming", "recording", "bandwidth"
    .addColumn("duration_minutes", "integer", (col) => col.defaultTo(0))
    .addColumn("bandwidth_gb", "decimal(10, 2)", (col) => col.defaultTo(0))
    .addColumn("cost_cents", "integer", (col) => col.notNull()) // Cost in cents (e.g., 150 = $1.50)
    .addColumn("month", "varchar(7)", (col) => col.notNull()) // "2026-01"
    .addColumn("created_at", "timestamp", (col) =>
      col.defaultTo(db.fn("now")).notNull(),
    )
    .execute();

  // Index for monthly aggregations
  await db.schema
    .createIndex("idx_cost_records_month")
    .on("cost_records")
    .column("month")
    .execute();

  await db.schema
    .createIndex("idx_cost_records_channel")
    .on("cost_records")
    .column("channel_id")
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable("cost_records").execute();
}
