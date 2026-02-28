import { WebSocketServer } from 'ws';
import { applyWSSHandler } from '@trpc/server/adapters/ws';
import { appRouter } from '../routers';
import type { IncomingMessage, Server } from 'http';
import { Context } from '../types/context';
import { verifyToken } from '../utils/auth';
import { removeUserFromAnyChannel } from './broadcast';

// Accept HTTP server instance instead of port
export function createWebSocketServer(server: Server) {
  console.log('🔌 Creating WebSocket server attached to HTTP server...');
  
  const wss = new WebSocketServer({
    server, // Attach to existing HTTP server
    perMessageDeflate: false, // Disable compression for lower latency
  });

  // Apply tRPC WebSocket handler
  const handler = applyWSSHandler({
    wss,
    router: appRouter,
    createContext: ({ req }: { req: IncomingMessage }): Context => {
      // Extract token from query string or headers
      const url = new URL(req.url || '', `http://${req.headers.host}`);
      const token = url.searchParams.get('token') || req.headers.authorization?.replace('Bearer ', '');

      if (token) {
        try {
          const payload = verifyToken(token);
          if (payload) {
            return { userId: payload.userId };
          }
        } catch (error) {
          console.error('Invalid WebSocket token:', error);
        }
      }

      return {};
    },
  });

  // Connection logging
  wss.on('connection', (ws, req) => {
    const ip = req.socket.remoteAddress;
    console.log(`✅ WebSocket client connected from ${ip}`);
    
    ws.on('close', () => {
      console.log(`❌ WebSocket client disconnected from ${ip}`);
      // Remove from any channel they were in
      removeUserFromAnyChannel(ws);
    });
    
    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });

  // Server error handling
  wss.on('error', (error) => {
    console.error('❌ WebSocket server error:', error);
  });

  console.log('✅ WebSocket server attached and ready');

  return { wss, handler };
}

export function closeWebSocketServer(wss: WebSocketServer) {
  return new Promise<void>((resolve) => {
    wss.close(() => {
      console.log('WebSocket server closed');
      resolve();
    });
  });
}
