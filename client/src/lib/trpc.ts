import { createTRPCReact } from '@trpc/react-query';
import { httpBatchLink, loggerLink, splitLink, createWSClient, wsLink } from '@trpc/client';
import type { AppRouter } from '../../../src/routers';
import { getToken } from './auth';

export const trpc = createTRPCReact<AppRouter>();

// Create WebSocket client
const wsClient = createWSClient({
  url: () => {
    const baseUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:3001';
    const token = getToken();
    
    // Pass token as query parameter for WebSocket authentication
    if (token) {
      return `${baseUrl}?token=${token}`;
    }
    return baseUrl;
  },
  
  // Reconnection configuration - exponential backoff
  retryDelayMs: (attemptIndex) => {
    return Math.min(1000 * 2 ** attemptIndex, 10000); // Max 10s
  },
});

// Export WebSocket client for status monitoring
export { wsClient };
