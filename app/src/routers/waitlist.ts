import { z } from "zod";
import { router, publicProcedure } from "../trpc";
import { waitlistRepository } from "../repositories/WaitlistRepository";
import { TRPCError } from "@trpc/server";

export const waitlistRouter = router({
  join: publicProcedure
    .input(
      z.object({
        email: z.string().email("Adresse email invalide"),
        role: z.enum(["buyer", "seller"]),
      }),
    )
    .mutation(async ({ input }) => {
      const already = await waitlistRepository.existsByEmailAndRole(
        input.email,
        input.role,
      );
      if (already) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Vous êtes déjà inscrit sur la liste d'attente.",
        });
      }
      await waitlistRepository.save(input.email, input.role);
      return { success: true };
    }),
});
