import { createTRPCReact } from "@trpc/react-query";
import { httpBatchLink, splitLink, createWSClient, wsLink } from "@trpc/client";
import type { AppRouter } from "@server/routers";
import { getToken } from "./auth";
import { getApiUrl, getWsUrl } from "./config";

/**
 * tRPC React hooks — typed with AppRouter from the backend.
 */
export const trpc = createTRPCReact<AppRouter>();

/**
 * WebSocket client for tRPC subscriptions (chat, real-time events).
 */
export const wsClient = createWSClient({
  url: () => {
    const wsUrl = getWsUrl();
    const token = getToken();
    return token ? `${wsUrl}?token=${token}` : wsUrl;
  },
  retryDelayMs: (attemptIndex) => {
    return Math.min(1000 * 2 ** attemptIndex, 10000); // Max 10s
  },
});

/**
 * Create the tRPC client instance.
 * - HTTP batch link for queries/mutations
 * - WebSocket link for subscriptions
 */
export function createTRPCClient() {
  return trpc.createClient({
    links: [
      splitLink({
        condition: (op) => op.type === "subscription",
        true: wsLink({ client: wsClient }),
        false: httpBatchLink({
          url: `${getApiUrl()}/trpc`,
          headers() {
            const token = getToken();
            return token ? { authorization: `Bearer ${token}` } : {};
          },
        }),
      }),
    ],
  });
}
