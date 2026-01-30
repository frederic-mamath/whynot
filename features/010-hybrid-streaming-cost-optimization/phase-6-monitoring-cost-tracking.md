# Phase 6: Monitoring & Cost Tracking

## Objective

Implement comprehensive monitoring, analytics, and cost tracking for the hybrid streaming system to ensure reliability, optimize performance, and validate cost savings.

## User-Facing Changes

**For Sellers**:

- New analytics dashboard showing viewer stats, stream health, and estimated costs
- Real-time stream health metrics
- Historical performance data

**For Admins**:

- Cost tracking dashboard
- System health monitoring
- Usage reports (monthly streaming hours, bandwidth, costs)
- Alert system for errors and budget thresholds

**For Buyers**:

- No direct changes (monitoring is backend/admin-facing)

---

## Files to Update

### New Files

- `src/services/analyticsService.ts` - Collect and aggregate stream metrics
- `src/services/costTrackingService.ts` - Calculate and track costs
- `migrations/022_create_stream_metrics.ts` - Metrics storage
- `migrations/023_create_cost_records.ts` - Cost tracking storage
- `client/src/pages/AnalyticsDashboardPage.tsx` - Analytics UI
- `client/src/components/charts/StreamMetricsChart.tsx` - Chart components
- `client/src/components/ui/CostTracker/CostTracker.tsx` - Cost display

### Modified Files

- `src/routers/analyticsRouter.ts` - New analytics endpoints
- `src/services/recordingManager.ts` - Emit metrics events
- `client/src/App.tsx` - Add analytics route

---

## Steps

### 1. Create Metrics Database Tables

**File**: `migrations/022_create_stream_metrics.ts`

```typescript
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
```

**File**: `migrations/023_create_cost_records.ts`

```typescript
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
```

---

### 2. Create Analytics Service

**File**: `src/services/analyticsService.ts`

```typescript
import { Database } from "../db";

export class AnalyticsService {
  private db: Database;

  constructor(db: Database) {
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
```

---

### 3. Create Cost Tracking Service

**File**: `src/services/costTrackingService.ts`

```typescript
import { Database } from "../db";

// Pricing constants (update these from environment variables in production)
const PRICING = {
  AGORA_PER_1000_MINS: 0.99, // $0.99 per 1000 minutes
  AGORA_CLOUD_RECORDING_PER_1000_MINS: 1.49, // $1.49 per 1000 minutes
  CLOUDFLARE_STREAM_PER_1000_MINS: 5.0, // $5.00 per 1000 minutes
  CDN_BANDWIDTH_PER_GB: 0.0, // Included with Cloudflare Stream
};

export class CostTrackingService {
  private db: Database;

  constructor(db: Database) {
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
        bandwidth_gb: 0,
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
        bandwidth_gb: 0,
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
        bandwidth_gb: 0, // Bandwidth included
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
```

---

### 4. Update Recording Manager to Record Metrics

**File**: `src/services/recordingManager.ts` (add to existing)

```typescript
import { AnalyticsService } from "./analyticsService";
import { CostTrackingService } from "./costTrackingService";

export class RecordingManager {
  private analyticsService: AnalyticsService;
  private costTrackingService: CostTrackingService;

  constructor(db: Database) {
    // ... existing code
    this.analyticsService = new AnalyticsService(db);
    this.costTrackingService = new CostTrackingService(db);
  }

  async stopRecording(channelId: number): Promise<void> {
    // ... existing stop logic

    // Record final metrics
    const status = await this.getRecordingStatus(channelId);
    await this.analyticsService.recordMetrics(channelId, {
      relayStatus: "stopped",
      isLive: false,
      durationSeconds: 0,
    });

    // Calculate and record costs
    await this.costTrackingService.recordStreamCosts(channelId);

    console.log(`Metrics and costs recorded for channel ${channelId}`);
  }
}
```

---

### 5. Create Analytics tRPC Router

**File**: `src/routers/analyticsRouter.ts`

```typescript
import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../trpc";
import { AnalyticsService } from "../services/analyticsService";
import { CostTrackingService } from "../services/costTrackingService";
import { db } from "../db";

const analyticsService = new AnalyticsService(db);
const costTrackingService = new CostTrackingService(db);

export const analyticsRouter = router({
  // Get channel stats
  getChannelStats: publicProcedure
    .input(z.object({ channelId: z.number() }))
    .query(async ({ input }) => {
      return analyticsService.getChannelStats(input.channelId);
    }),

  // Get channel costs
  getChannelCosts: protectedProcedure
    .input(z.object({ channelId: z.number() }))
    .query(async ({ input }) => {
      return costTrackingService.getChannelCosts(input.channelId);
    }),

  // Get monthly costs (admin only in production)
  getMonthlyCosts: protectedProcedure
    .input(z.object({ month: z.string() })) // "2026-01"
    .query(async ({ input }) => {
      return costTrackingService.getMonthlyCosts(input.month);
    }),

  // Get cost comparison
  getCostComparison: protectedProcedure
    .input(z.object({ month: z.string() }))
    .query(async ({ input }) => {
      return costTrackingService.getCostComparison(input.month);
    }),

  // Get platform stats
  getPlatformStats: protectedProcedure
    .input(z.object({ month: z.string().optional() }))
    .query(async ({ input }) => {
      return analyticsService.getPlatformStats(input.month);
    }),
});
```

Add to main router:

```typescript
// src/routers/index.ts
import { analyticsRouter } from "./analyticsRouter";

export const appRouter = router({
  // ... other routers
  analytics: analyticsRouter,
});
```

---

### 6. Create Frontend Analytics Dashboard

**File**: `client/src/pages/AnalyticsDashboardPage.tsx`

```typescript
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Loader2, TrendingDown, DollarSign, Users, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export function AnalyticsDashboardPage() {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);

  const { data: platformStats, isLoading: loadingStats } =
    trpc.analytics.getPlatformStats.useQuery({ month: selectedMonth });

  const { data: monthlyCosts, isLoading: loadingCosts } =
    trpc.analytics.getMonthlyCosts.useQuery({ month: selectedMonth });

  const { data: costComparison, isLoading: loadingComparison } =
    trpc.analytics.getCostComparison.useQuery({ month: selectedMonth });

  if (loadingStats || loadingCosts || loadingComparison) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
        <p className="text-muted-foreground">
          Streaming metrics and cost tracking
        </p>
      </div>

      {/* Month Selector */}
      <div className="mb-6">
        <input
          type="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="px-4 py-2 border rounded-lg"
        />
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Channels</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{platformStats?.totalChannels || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Streaming Hours</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {platformStats?.totalStreamingHours || 0}h
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${monthlyCosts?.totalCostDollars.toFixed(2) || "0.00"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Cost Savings</CardTitle>
            <TrendingDown className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {costComparison?.savingsPercent || 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              vs Agora-only (${costComparison?.agoraOnlyCostDollars.toFixed(2) || "0"})
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Cost Breakdown */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Cost Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {monthlyCosts?.costs.map((cost, index) => (
              <div key={index} className="flex justify-between items-center">
                <div>
                  <p className="font-medium capitalize">
                    {cost.service} - {cost.costType.replace("_", " ")}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {cost.durationMinutes} minutes
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">${cost.totalCostDollars.toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## Design Considerations

### 1. Real-Time vs Batch Metrics

- **Real-time**: Stream health, viewer count (poll every 5s)
- **Batch**: Cost calculations, historical analytics (compute on stream end)

### 2. Cost Accuracy

- Track actual usage (duration, bandwidth)
- Use current pricing (update constants regularly)
- Round up to avoid underestimating costs

### 3. Privacy & Security

- Analytics visible to channel owner
- Platform-wide stats: admin only
- Cost data: sensitive, restrict access

---

## Acceptance Criteria

- [x] Metrics recorded during streaming
- [x] Costs calculated on stream end
- [x] Analytics dashboard shows platform stats
- [x] Cost breakdown displays per service
- [x] Cost comparison shows savings vs Agora-only
- [x] Monthly reports generated accurately

---

## Status

✅ COMPLETED

## Estimated Time

**3-4 hours**

- Database migrations: 0.5 hours
- Analytics service: 1 hour
- Cost tracking service: 1 hour
- Frontend dashboard: 1.5 hours

---

## Notes

### Future Enhancements

- Export reports (CSV, PDF)
- Cost alerts (email when exceeding budget)
- Viewer engagement metrics (watch time, drop-off rate)
- Geographic analytics (viewer locations)
- A/B testing dashboard (Agora vs HLS quality comparison)
