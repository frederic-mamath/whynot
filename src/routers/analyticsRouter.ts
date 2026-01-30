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
