import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../trpc";
import { RecordingManager } from "../services/recordingManager";

const recordingManager = new RecordingManager();

/**
 * Recording Router
 * tRPC endpoints for managing Agora Cloud Recording → Cloudflare Stream
 */
export const recordingRouter = router({
  /**
   * Start recording for a channel
   * Initiates Agora Cloud Recording with RTMP push to Cloudflare Stream
   */
  start: protectedProcedure
    .input(
      z.object({
        channelId: z.number(),
        channelName: z.string(),
        sellerUid: z.number(),
      }),
    )
    .mutation(async ({ input }) => {
      const result = await recordingManager.startRecording(
        input.channelId,
        input.channelName,
        input.sellerUid,
      );

      return {
        success: true,
        hlsPlaybackUrl: result.hlsPlaybackUrl,
      };
    }),

  /**
   * Stop recording for a channel
   * Stops Agora Cloud Recording and retrieves VOD URL
   */
  stop: protectedProcedure
    .input(z.object({ channelId: z.number() }))
    .mutation(async ({ input }) => {
      await recordingManager.stopRecording(input.channelId);

      return { success: true };
    }),

  /**
   * Get current recording status
   * Returns relay status, live state, and HLS URL
   */
  getStatus: publicProcedure
    .input(z.object({ channelId: z.number() }))
    .query(async ({ input }) => {
      return recordingManager.getRecordingStatus(input.channelId);
    }),

  /**
   * Query Agora recording details (for debugging)
   */
  queryAgora: protectedProcedure
    .input(z.object({ channelId: z.number() }))
    .query(async ({ input }) => {
      return recordingManager.queryAgoraRecording(input.channelId);
    }),
});
