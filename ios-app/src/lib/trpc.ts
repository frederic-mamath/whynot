import { createTRPCReact } from "@trpc/react-query";
import { httpBatchLink, splitLink, createWSClient, wsLink } from "@trpc/client";
import type { AppRouter } from "@server/routers";
import { getToken } from "./auth";
import { getApiUrl, getWsUrl } from "./config";

export const trpc = createTRPCReact<AppRouter>();

export const wsClient = createWSClient({
  url: () => {
    const token = getToken();
    const base = getWsUrl();
    console.log("[wsClient] connecting", { base, tokenPresent: !!token });
    return token ? `${base}?token=${token}` : base;
  },
  retryDelayMs: (attempt) => Math.min(1000 * 2 ** attempt, 10_000),
  // Lazy: open the socket only when a subscription actually needs it, and
  // close it shortly after the last one unmounts. This avoids the eager
  // connect-at-app-launch that handshakes anonymously (before login) and
  // never re-authenticates. Subscriptions only live on the live screen —
  // deep in the authenticated flow — so the socket always opens with a token.
  lazy: { enabled: true, closeMs: 1000 },
});

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
