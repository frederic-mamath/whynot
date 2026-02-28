import { router } from "../trpc";
import { authRouter } from "./auth";
import { channelRouter } from "./channel";
import { shopRouter } from "./shop";
import { productRouter } from "./product";
import { vendorPromotionRouter } from "./vendorPromotion";
import { roleRouter } from "./role";
import { messageRouter } from "./message";
import { auctionRouter } from "./auction";
import { orderRouter } from "./order";
import { payoutRouter } from "./payout";
import { profileRouter } from "./profile";

export const appRouter = router({
  auth: authRouter,
  channel: channelRouter,
  shop: shopRouter,
  product: productRouter,
  vendorPromotion: vendorPromotionRouter,
  role: roleRouter,
  message: messageRouter,
  auction: auctionRouter,
  order: orderRouter,
  payout: payoutRouter,
  profile: profileRouter,
});

export type AppRouter = typeof appRouter;
