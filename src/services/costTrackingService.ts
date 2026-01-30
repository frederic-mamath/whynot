import { Database } from "../db";
import { Kysely } from "kysely";

// Pricing constants (update these from environment variables in production)
const PRICING = {
  AGORA_PER_1000_MINS: 0.99, // $0.99 per 1000 minutes
  AGORA_CLOUD_RECORDING_PER_1000_MINS: 1.49, // $1.49 per 1000 minutes
  CLOUDFLARE_STREAM_PER_1000_MINS: 5.0, // $5.00 per 1000 minutes
  CDN_BANDWIDTH_PER_GB: 0.0, // Included with Cloudflare Stream
};

export class CostTrackingService {
  private db: Kysely<Database>;

  constructor(db: Kysely<Database>) {
    this.db = db;
  }

  /**
   * Record costs for a completed stream
   */
  async recordStreamCosts(channelId: number): Promise<void> {
    const channel = await this.db
      .selectFrom("channels")
      .selectAll()
      .where("id", "=", channelId)
      .executeTakeFirst();

    if (!channel || !channel.started_at || !channel.ended_at) {
      throw new Error("Channel not found or incomplete");
    }

    const durationMs =
      channel.ended_at.getTime() - channel.started_at.getTime();
    const durationMinutes = durationMs / 1000 / 60;
    const month = channel.started_at.toISOString().slice(0, 7);

    // Agora cost (seller only, 1 participant)
    const agoraCostCents = Math.ceil(
      (durationMinutes / 1000) * PRICING.AGORA_PER_1000_MINS * 100,
    );

    await this.db
      .insertInto("cost_records")
      .values({
        channel_id: channelId,
        service: "agora",
        cost_type: "streaming",
        duration_minutes: Math.ceil(durationMinutes),
        bandwidth_gb: "0",
        cost_cents: agoraCostCents,
        month,
      })
      .execute();

    // Agora Cloud Recording cost
    const cloudRecordingCostCents = Math.ceil(
      (durationMinutes / 1000) *
        PRICING.AGORA_CLOUD_RECORDING_PER_1000_MINS *
        100,
    );

    await this.db
      .insertInto("cost_records")
      .values({
        channel_id: channelId,
        service: "agora",
        cost_type: "recording",
        duration_minutes: Math.ceil(durationMinutes),
        bandwidth_gb: "0",
        cost_cents: cloudRecordingCostCents,
        month,
      })
      .execute();

    // Cloudflare Stream cost
    const cloudflareCostCents = Math.ceil(
      (durationMinutes / 1000) * PRICING.CLOUDFLARE_STREAM_PER_1000_MINS * 100,
    );

    await this.db
      .insertInto("cost_records")
      .values({
        channel_id: channelId,
        service: "cloudflare",
        cost_type: "streaming",
        duration_minutes: Math.ceil(durationMinutes),
        bandwidth_gb: "0", // Bandwidth included
        cost_cents: cloudflareCostCents,
        month,
      })
      .execute();

    console.log(
      `Recorded costs for channel ${channelId}: Agora $${agoraCostCents / 100}, Cloud Recording $${cloudRecordingCostCents / 100}, Cloudflare $${cloudflareCostCents / 100}`,
    );
  }

  /**
   * Get total costs for a specific month
   */
  async getMonthlyCosts(month: string) {
    const costs = await this.db
      .selectFrom("cost_records")
      .select((eb) => [
        "service",
        "cost_type",
        eb.fn.sum("cost_cents").as("total_cost_cents"),
        eb.fn.sum("duration_minutes").as("total_duration_minutes"),
        eb.fn.sum("bandwidth_gb").as("total_bandwidth_gb"),
      ])
      .where("month", "=", month)
      .groupBy(["service", "cost_type"])
      .execute();

    const totalCents = costs.reduce(
      (sum, record) => sum + Number(record.total_cost_cents),
      0,
    );

    return {
      month,
      costs: costs.map((record) => ({
        service: record.service,
        costType: record.cost_type,
        totalCostCents: Number(record.total_cost_cents),
        totalCostDollars: Number(record.total_cost_cents) / 100,
        durationMinutes: Number(record.total_duration_minutes),
        bandwidthGB: Number(record.total_bandwidth_gb),
      })),
      totalCostCents: totalCents,
      totalCostDollars: totalCents / 100,
    };
  }

  /**
   * Get cost breakdown for a specific channel
   */
  async getChannelCosts(channelId: number) {
    const costs = await this.db
      .selectFrom("cost_records")
      .selectAll()
      .where("channel_id", "=", channelId)
      .execute();

    const totalCents = costs.reduce(
      (sum, record) => sum + record.cost_cents,
      0,
    );

    return {
      channelId,
      costs: costs.map((record) => ({
        service: record.service,
        costType: record.cost_type,
        costCents: record.cost_cents,
        costDollars: record.cost_cents / 100,
        durationMinutes: record.duration_minutes,
      })),
      totalCostCents: totalCents,
      totalCostDollars: totalCents / 100,
    };
  }

  /**
   * Compare costs: Agora-only vs Hybrid (for reporting)
   */
  async getCostComparison(month: string) {
    const hybridCosts = await this.getMonthlyCosts(month);

    // Calculate what it would have cost with Agora-only
    // Get total viewer-minutes (estimate from metrics)
    const metricsResult = await this.db
      .selectFrom("stream_metrics")
      .innerJoin("channels", "channels.id", "stream_metrics.channel_id")
      .select((eb) => [
        eb.fn.sum("stream_metrics.hls_viewers").as("total_viewers"),
        eb.fn.count("stream_metrics.id").as("metric_count"),
      ])
      .where("channels.started_at", ">=", new Date(`${month}-01`))
      .executeTakeFirst();

    const avgViewers =
      Number(metricsResult?.total_viewers || 0) /
      Number(metricsResult?.metric_count || 1);

    const totalStreamingMinutes =
      hybridCosts.costs.find(
        (c) => c.service === "agora" && c.costType === "streaming",
      )?.durationMinutes || 0;

    const agoraOnlyCostCents = Math.ceil(
      ((totalStreamingMinutes * avgViewers) / 1000) *
        PRICING.AGORA_PER_1000_MINS *
        100,
    );

    const savingsCents = agoraOnlyCostCents - hybridCosts.totalCostCents;
    const savingsPercent =
      agoraOnlyCostCents > 0
        ? Math.round((savingsCents / agoraOnlyCostCents) * 100)
        : 0;

    return {
      month,
      hybridCostDollars: hybridCosts.totalCostDollars,
      agoraOnlyCostDollars: agoraOnlyCostCents / 100,
      savingsDollars: savingsCents / 100,
      savingsPercent,
      avgViewers: Math.round(avgViewers),
    };
  }
}
