import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { cloudinaryService } from "../services/CloudinaryService";
import { TRPCError } from "@trpc/server";

export const imageRouter = router({
  /**
   * Upload a base64-encoded image to Cloudinary
   * Returns the Cloudinary URL and public ID
   */
  upload: protectedProcedure
    .input(
      z.object({
        base64: z
          .string()
          .min(1, "Image data is required")
          .max(10_000_000, "Image too large (max ~7MB)"),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        const result = await cloudinaryService.uploadImage(input.base64);
        return {
          url: result.url,
          publicId: result.publicId,
          width: result.width,
          height: result.height,
        };
      } catch (error: any) {
        console.error("Cloudinary upload error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to upload image",
        });
      }
    }),
});
