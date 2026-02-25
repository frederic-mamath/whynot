import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../trpc";
import { FFmpegRelayService } from "../services/ffmpegRelayService";

// Lazy initialization
let ffmpegRelayService: FFmpegRelayService | null = null;
function getFFmpegRelayService(): FFmpegRelayService {
  if (!ffmpegRelayService) {
    ffmpegRelayService = new FFmpegRelayService();
  }
  return ffmpegRelayService;
}

/**
 * Relay Router
 * tRPC endpoints for managing FFmpeg-based RTC → RTMP relay
 */
export const relayRouter = router({
  /**
   * Start FFmpeg relay for a channel
   * Creates Cloudflare Stream endpoint and enqueues job for worker
   */
  startFFmpeg: protectedProcedure
    .input(
      z.object({
        channelId: z.number(),
        channelName: z.string(),
        sellerUid: z.number(),
      }),
    )
    .mutation(async ({ input }) => {
      const result = await getFFmpegRelayService().startRelay({
        channelId: input.channelId,
        channelName: input.channelName,
        sellerUid: input.sellerUid,
      });

      return {
        success: true,
        hlsPlaybackUrl: result.hlsPlaybackUrl,
        jobId: result.jobId,
      };
    }),

  /**
   * Stop FFmpeg relay for a channel
   * Removes job from queue and stops Cloudflare Stream
   */
  stopFFmpeg: protectedProcedure
    .input(z.object({ channelId: z.number() }))
    .mutation(async ({ input }) => {
      await getFFmpegRelayService().stopRelay(input.channelId);

      return { success: true };
    }),

  /**
   * Get FFmpeg relay status
   * Returns relay state, active jobs, and HLS URL
   */
  getFFmpegStatus: publicProcedure
    .input(z.object({ channelId: z.number() }))
    .query(async ({ input }) => {
      return getFFmpegRelayService().getRelayStatus(input.channelId);
    }),
});
