import { createTRPCReact } from '@trpc/react-query';
import { httpBatchLink, loggerLink, splitLink, createWSClient, wsLink } from '@trpc/client';
import type { AppRouter } from '../../../src/routers';
import { getToken } from './auth';

export const trpc = createTRPCReact<AppRouter>();

// Create WebSocket client
const wsClient = createWSClient({
  url: () => {
    // Use same domain as HTTP API (auto-detect protocol)
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const wsProtocol = apiUrl.startsWith('https') ? 'wss' : 'ws';
    const wsUrl = apiUrl.replace(/^https?/, wsProtocol);
    
    const token = getToken();
    
    // Pass token as query parameter for WebSocket authentication
    if (token) {
      return `${wsUrl}?token=${token}`;
    }
    return wsUrl;
  },
  
  // Reconnection configuration - exponential backoff
  retryDelayMs: (attemptIndex) => {
    return Math.min(1000 * 2 ** attemptIndex, 10000); // Max 10s
  },
});

// Export WebSocket client for status monitoring
export { wsClient };
