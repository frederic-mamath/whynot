/**
 * Backward compat alias – all logic lives in live.ts.
 * This router will be removed in T04 (frontend full rename).
 */
export {
  liveRouter as channelRouter,
  liveEvents as channelEvents,
} from "./live";
