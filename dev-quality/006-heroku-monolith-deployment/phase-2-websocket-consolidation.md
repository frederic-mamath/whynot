# Phase 2: WebSocket Server Consolidation

## Objective

Merge the standalone WebSocket server (port 3001) into the main Express HTTP server so both run on the same port, enabling deployment on Heroku's single-port model.

## Duration

~1.5 hours

## Files to Update

- `src/websocket/server.ts` - Accept HTTP server instance
- `src/index.ts` - Pass HTTP server to WebSocket setup
- `client/src/lib/trpc.ts` - Update WebSocket URL logic
- `.env.example` - Remove WS_PORT, update VITE_WS_URL

## Current Architecture

```
Port 3000: Express HTTP Server (tRPC)
Port 3001: WebSocket Server (tRPC subscriptions)
```

## Target Architecture

```
Port $PORT: Express HTTP Server
  ├── HTTP/tRPC
  └── WebSocket (upgraded connections)
```

## Steps

### 1. Update WebSocket Server Creation (30 min)

**Modify `src/websocket/server.ts`**:

```typescript
import { WebSocketServer } from 'ws';
import { applyWSSHandler } from '@trpc/server/adapters/ws';
import { appRouter } from '../routers';
import type { IncomingMessage, Server } from 'http';
import { Context } from '../types/context';
import { verifyToken } from '../utils/auth';

// Change: Accept HTTP server instead of port
export function createWebSocketServer(server: Server) {
  console.log('🔌 Creating WebSocket server attached to HTTP server...');
  
  const wss = new WebSocketServer({
    server, // Attach to existing HTTP server
    perMessageDeflate: false,
  });

  const handler = applyWSSHandler({
    wss,
    router: appRouter,
    createContext: ({ req }: { req: IncomingMessage }): Context => {
      const url = new URL(req.url || '', `http://${req.headers.host}`);
      const token = url.searchParams.get('token') || 
                    req.headers.authorization?.replace('Bearer ', '');

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

  wss.on('connection', (ws, req) => {
    const ip = req.socket.remoteAddress;
    console.log(`✅ WebSocket client connected from ${ip}`);
    
    ws.on('close', () => {
      console.log(`❌ WebSocket client disconnected from ${ip}`);
    });
    
    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });

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
```

**Changes**:
- Parameter changed from `port: number` to `server: Server`
- WebSocket now upgrades HTTP connections on same port
- No separate port binding

### 2. Update Express Server (20 min)

**Modify `src/index.ts`**:

```typescript
// ... existing imports

const app = express();
const port = process.env.PORT || 3000;
// Remove: const wsPort = process.env.WS_PORT || 3001;

// ... middleware setup

// Create HTTP server
const server = app.listen(port, () => {
  console.log(`🚀 HTTP server running on port ${port}`);
  console.log(`📡 tRPC endpoint: http://localhost:${port}/trpc`);
});

// Attach WebSocket to same server (not in Passenger mode)
if (typeof PhusionPassenger === "undefined") {
  const { wss } = createWebSocketServer(server); // Pass server instance
  
  // Graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully...');
    wss.close(() => {
      console.log('WebSocket server closed');
      server.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
      });
    });
  });

  process.on('SIGINT', async () => {
    console.log('\nSIGINT received, shutting down gracefully...');
    wss.close(() => {
      console.log('WebSocket server closed');
      server.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
      });
    });
  });
}
```

**Changes**:
- Create HTTP server with `app.listen()` first
- Pass server instance to `createWebSocketServer()`
- Remove separate WS_PORT logic

### 3. Update Client WebSocket URL (25 min)

**Modify `client/src/lib/trpc.ts`**:

```typescript
// Create WebSocket client
const wsClient = createWSClient({
  url: () => {
    // In production, use same domain as HTTP (wss:// for HTTPS, ws:// for HTTP)
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
  
  retryDelayMs: (attemptIndex) => {
    return Math.min(1000 * 2 ** attemptIndex, 10000);
  },
});
```

**Changes**:
- Use `VITE_API_URL` for both HTTP and WebSocket
- Automatically switch protocol (http→ws, https→wss)
- Remove separate `VITE_WS_URL` environment variable

### 4. Update Environment Configuration (10 min)

**Update `.env.example`**:

```bash
DATABASE_URL=postgres://postgres:postgres@localhost:5432/whynot
DB_HOST=localhost
DB_PORT=5432
DB_NAME=whynot
DB_USER=postgres
DB_PASSWORD=postgres
JWT_SECRET=your-secret-key-change-this-in-production
PORT=3000
# WS_PORT=3001  ← REMOVE THIS
CORS_ORIGIN=http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173
AGORA_APP_ID=your_agora_app_id
AGORA_APP_CERTIFICATE=your_agora_app_certificate
VITE_API_URL=http://localhost:3000
# VITE_WS_URL=ws://localhost:3001  ← REMOVE THIS (now uses VITE_API_URL)
```

**Update local `.env`**:
- Remove `WS_PORT=3001`
- Remove `VITE_WS_URL` (optional: can keep for backward compatibility during testing)

### 5. Test WebSocket on Single Port (15 min)

```bash
# Terminal 1: Start development mode
npm run dev

# Terminal 2: Start client
npm run dev:client

# In browser console (http://localhost:5173):
# Check WebSocket connection - should connect to ws://localhost:3000
```

**Verify**:
- WebSocket connects to same port as HTTP (3000)
- Chat/real-time features still work
- No errors in browser console or server logs

### 6. Test Production Build (10 min)

```bash
# Build and start production server
npm run build
NODE_ENV=production npm start

# Visit http://localhost:3000
# Check browser DevTools Network tab - WebSocket should connect to ws://localhost:3000
```

## Design Considerations

### WebSocket Upgrade Handshake

When client requests WebSocket connection:
1. Client sends HTTP Upgrade request to `ws://localhost:3000`
2. Express server receives request
3. WebSocket server (attached to same server) handles upgrade
4. Connection established

**No port change needed** - all on same server.

### Development vs Production URLs

| Environment | HTTP API | WebSocket |
|-------------|----------|-----------|
| Development | http://localhost:3000/trpc | ws://localhost:3000 |
| Production | https://app.herokuapp.com/trpc | wss://app.herokuapp.com |

Both use **same domain** - just different protocol.

### Heroku Compatibility

Heroku provides single `$PORT` environment variable:
- HTTP server listens on `$PORT`
- WebSocket upgrades happen on same `$PORT`
- Router automatically handles both HTTP and WebSocket traffic

## Acceptance Criteria

- [x] WebSocket server starts on same port as HTTP server
- [x] `WS_PORT` environment variable removed
- [x] Client connects to WebSocket using `VITE_API_URL` (not separate WS URL)
- [x] Development mode: WebSocket connects to `ws://localhost:3000`
- [x] Production build: WebSocket connects to same domain as HTTP
- [x] Real-time features (chat, subscriptions) still work
- [x] No errors in browser console or server logs
- [x] Graceful shutdown closes both HTTP and WebSocket connections

## Status

📝 **PLANNING** - Ready to begin after Phase 1

## Notes

- WebSocket upgrade happens automatically when client sends `Upgrade: websocket` header
- No code changes needed for tRPC subscriptions - they automatically use WebSocket link
- This change is **required** for Heroku deployment (single port model)
- Test thoroughly before deploying - WebSocket issues are harder to debug in production
