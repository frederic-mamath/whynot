import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Loader2, TrendingDown, DollarSign, Users, Clock } from "lucide-react";

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
            <CardTitle className="text-sm font-medium">
              Total Channels
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {platformStats?.totalChannels || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Streaming Hours
            </CardTitle>
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
              vs Agora-only ($
              {costComparison?.agoraOnlyCostDollars.toFixed(2) || "0"})
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
                  <p className="font-semibold">
                    ${cost.totalCostDollars.toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
