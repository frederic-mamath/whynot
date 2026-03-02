import { QueryClient } from "@tanstack/react-query";

/**
 * Shared QueryClient instance for TanStack React Query.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Retry failed queries once
      retry: 1,
      // Consider data stale after 30 seconds
      staleTime: 30 * 1000,
      // Don't refetch on window focus (no window on mobile)
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});
