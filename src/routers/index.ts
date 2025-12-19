import { router } from '../trpc';
import { authRouter } from './auth';
import { channelRouter } from './channel';

export const appRouter = router({
  auth: authRouter,
  channel: channelRouter,
});

export type AppRouter = typeof appRouter;
