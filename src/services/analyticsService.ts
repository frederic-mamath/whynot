import { Database } from "../db";
import { Kysely } from "kysely";

export class AnalyticsService {
  private db: Kysely<Database>;

  constructor(db: Kysely<Database>) {
    this.db = db;
  }

  /**
   * Record stream metrics (called periodically during streaming)
   */
  async recordMetrics(
    channelId: number,
    metrics: {
      relayStatus: string;
      isLive: boolean;
      hlsViewers?: number;
      durationSeconds: number;
      cloudflareStreamId?: string;
    },
  ): Promise<void> {
    await this.db
      .insertInto("stream_metrics")
      .values({
        channel_id: channelId,
        relay_status: metrics.relayStatus,
        is_live: metrics.isLive,
        hls_viewers: metrics.hlsViewers ?? 0,
        duration_seconds: metrics.durationSeconds,
        cloudflare_stream_id: metrics.cloudflareStreamId,
      })
      .execute();
  }

  /**
   * Get metrics for a specific channel
   */
  async getChannelMetrics(channelId: number, startDate?: Date, endDate?: Date) {
    let query = this.db
      .selectFrom("stream_metrics")
      .selectAll()
      .where("channel_id", "=", channelId)
      .orderBy("timestamp", "desc");

    if (startDate) {
      query = query.where("timestamp", ">=", startDate);
    }

    if (endDate) {
      query = query.where("timestamp", "<=", endDate);
    }

    return query.execute();
  }

  /**
   * Get aggregated stats for a channel
   */
  async getChannelStats(channelId: number) {
    const channel = await this.db
      .selectFrom("channels")
      .selectAll()
      .where("id", "=", channelId)
      .executeTakeFirst();

    if (!channel) {
      throw new Error("Channel not found");
    }

    // Total duration
    const durationResult = await this.db
      .selectFrom("channels")
      .select((eb) => [
        eb.fn
          .coalesce(
            eb.fn("extract", [
              eb.val("epoch"),
              eb.fn("age", ["ended_at", "started_at"]),
            ]),
            eb.val(0),
          )
          .as("total_duration_seconds"),
      ])
      .where("id", "=", channelId)
      .executeTakeFirst();

    const totalDurationSeconds =
      Number(durationResult?.total_duration_seconds) || 0;

    // Peak viewers (max hls_viewers from metrics)
    const peakViewersResult = await this.db
      .selectFrom("stream_metrics")
      .select((eb) => eb.fn.max("hls_viewers").as("peak_viewers"))
      .where("channel_id", "=", channelId)
      .executeTakeFirst();

    const peakViewers = Number(peakViewersResult?.peak_viewers) || 0;

    // Average viewers
    const avgViewersResult = await this.db
      .selectFrom("stream_metrics")
      .select((eb) => eb.fn.avg("hls_viewers").as("avg_viewers"))
      .where("channel_id", "=", channelId)
      .where("hls_viewers", ">", 0)
      .executeTakeFirst();

    const avgViewers = Math.round(Number(avgViewersResult?.avg_viewers) || 0);

    return {
      channelId,
      totalDurationSeconds,
      peakViewers,
      avgViewers,
      startedAt: channel.started_at,
      endedAt: channel.ended_at,
      isActive: channel.is_active,
    };
  }

  /**
   * Get platform-wide metrics (for admins)
   */
  async getPlatformStats(month?: string) {
    const monthFilter = month || new Date().toISOString().slice(0, 7); // "2026-01"

    // Total streaming hours this month
    const channelsThisMonth = await this.db
      .selectFrom("channels")
      .selectAll()
      .where("started_at", ">=", new Date(`${monthFilter}-01`))
      .where(
        "started_at",
        "<",
        new Date(
          new Date(`${monthFilter}-01`).setMonth(
            new Date(`${monthFilter}-01`).getMonth() + 1,
          ),
        ),
      )
      .execute();

    let totalStreamingHours = 0;
    for (const channel of channelsThisMonth) {
      if (channel.started_at && channel.ended_at) {
        const durationMs =
          channel.ended_at.getTime() - channel.started_at.getTime();
        totalStreamingHours += durationMs / 1000 / 60 / 60;
      }
    }

    // Total active channels this month
    const totalChannels = channelsThisMonth.length;

    // Average viewers
    const avgViewersResult = await this.db
      .selectFrom("stream_metrics")
      .innerJoin("channels", "channels.id", "stream_metrics.channel_id")
      .select((eb) => eb.fn.avg("stream_metrics.hls_viewers").as("avg_viewers"))
      .where("channels.started_at", ">=", new Date(`${monthFilter}-01`))
      .executeTakeFirst();

    const avgViewers = Math.round(Number(avgViewersResult?.avg_viewers) || 0);

    return {
      month: monthFilter,
      totalStreamingHours: Math.round(totalStreamingHours * 10) / 10,
      totalChannels,
      avgViewers,
    };
  }
}
