import { useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { trpc, createTRPCClient } from "@/lib/trpc";
import { queryClient } from "@/lib/queryClient";

/**
 * Wraps the app with tRPC + React Query providers.
 * Creates the tRPC client once (stable across re-renders).
 */
export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const [trpcClient] = useState(() => createTRPCClient());

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
}
