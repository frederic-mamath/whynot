import { initTRPC, TRPCError } from "@trpc/server";
import { Context } from "./types/context";
import { db } from "./db";

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be logged in to access this resource",
    });
  }

  const user = await db
    .selectFrom("users")
    .select(["id", "email"])
    .where("id", "=", ctx.userId)
    .executeTakeFirst();

  if (!user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "User not found",
    });
  }

  return next({
    ctx: {
      ...ctx,
      user,
    },
  });
});
