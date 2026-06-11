import { createTRPCReact } from "@trpc/react-query";
import {
  httpBatchLink,
  splitLink,
  createWSClient,
  wsLink,
  TRPCClientError,
  type TRPCLink,
} from "@trpc/client";
import { observable } from "@trpc/server/observable";
import type { AppRouter } from "@server/routers";
import { getToken } from "./auth";
import { requestLogout } from "./authBus";
import { getApiUrl, getWsUrl } from "./config";

export const trpc = createTRPCReact<AppRouter>();

// `url` is a function, so it's called on every WebSocket (re)connect. After a
// 401 + logout the user is on the welcome screen; lazy.closeMs tears the
// socket down. The next subscription (after re-login) reopens with a fresh
// token read from expo-secure-store.
export const wsClient = createWSClient({
  url: () => {
    const token = getToken();
    const base = getWsUrl();
    console.warn("[wsClient] connecting", { base, tokenPresent: !!token });
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

// Detect 401 / UNAUTHORIZED responses and fire the logout bus. AuthContext
// subscribes and tears down the session — the user lands on (auth)/welcome.
// The error still propagates to the original caller so per-query error
// handling (banner, etc.) still fires.
const unauthorizedLink: TRPCLink<AppRouter> = () => {
  return ({ op, next }) => {
    return observable((observer) => {
      const subscription = next(op).subscribe({
        next(value) {
          observer.next(value);
        },
        error(err) {
          if (err instanceof TRPCClientError) {
            const code = err.data?.code;
            const status = err.data?.httpStatus;
            if (code === "UNAUTHORIZED" || status === 401) {
              requestLogout();
            }
          }
          observer.error(err);
        },
        complete() {
          observer.complete();
        },
      });
      return () => {
        subscription.unsubscribe();
      };
    });
  };
};

export function createTRPCClient() {
  return trpc.createClient({
    links: [
      unauthorizedLink,
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
