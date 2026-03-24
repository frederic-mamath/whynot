import { router } from "../trpc";
import { authRouter } from "./auth";
import { liveRouter } from "./live";
import { shopRouter } from "./shop";
import { productRouter } from "./product";
import { vendorPromotionRouter } from "./vendorPromotion";
import { roleRouter } from "./role";
import { messageRouter } from "./message";
import { auctionRouter } from "./auction";
import { orderRouter } from "./order";
import { payoutRouter } from "./payout";
import { profileRouter } from "./profile";
import { imageRouter } from "./image";
import { paymentRouter } from "./payment";
import { catalogRouter } from "./catalog";
import { sellerOnboardingRouter } from "./sellerOnboarding";
import { waitlistRouter } from "./waitlist";

export const appRouter = router({
  auth: authRouter,
  live: liveRouter,
  shop: shopRouter,
  product: productRouter,
  vendorPromotion: vendorPromotionRouter,
  role: roleRouter,
  message: messageRouter,
  auction: auctionRouter,
  order: orderRouter,
  payout: payoutRouter,
  profile: profileRouter,
  image: imageRouter,
  payment: paymentRouter,
  catalog: catalogRouter,
  sellerOnboarding: sellerOnboardingRouter,
  waitlist: waitlistRouter,
});

export type AppRouter = typeof appRouter;
