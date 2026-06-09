// Wraps a tRPC `useMutation` options object so that any error (thrown or
// returned via `onError`) surfaces through the global ErrorBanner.
//
// Usage:
//   const mutation = trpc.foo.bar.useMutation(
//     useMutationWithToast({ onSuccess: ... })
//   );
//
// The caller's `onError` (if any) still runs after the banner is shown,
// so screen-level state (inline form errors, loading flags) can still
// reset locally.

import type { UseMutationOptions } from "@tanstack/react-query";
import { useErrorBanner } from "./useErrorBanner";

const FALLBACK_MESSAGE = "Une erreur est survenue.";

function extractMessage(err: unknown): string {
  if (typeof err === "object" && err !== null && "message" in err) {
    const message = (err as { message?: unknown }).message;
    if (typeof message === "string" && message.length > 0) return message;
  }
  return FALLBACK_MESSAGE;
}

export function useMutationWithToast<
  TData = unknown,
  TError = unknown,
  TVariables = void,
  TContext = unknown,
>(
  options: UseMutationOptions<TData, TError, TVariables, TContext> = {},
): UseMutationOptions<TData, TError, TVariables, TContext> {
  const { showError } = useErrorBanner();

  return {
    ...options,
    onError: (err, vars, ctx, mutationFnContext) => {
      showError(extractMessage(err));
      options.onError?.(err, vars, ctx, mutationFnContext);
    },
  };
}
