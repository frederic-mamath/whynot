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
    return token ? `${base}?token=${token}` : base;
  },
  retryDelayMs: (attempt) => Math.min(1000 * 2 ** attempt, 10_000),
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
