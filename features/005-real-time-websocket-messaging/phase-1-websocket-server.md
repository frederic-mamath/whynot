# Phase 1: WebSocket Server Setup

**Estimated Time**: 1-1.5 hours  
**Status**: ⏳ To Do  
**Dependencies**: None

---

## Objective

Set up a WebSocket server alongside the existing Express HTTP server to handle real-time subscriptions.

---

## Tasks

### 1. Install Dependencies

```bash
npm install ws @types/ws
```

**Packages:**
- `ws@^8.14.2` - WebSocket server library
- `@types/ws@^8.5.10` - TypeScript types

---

### 2. Create WebSocket Server Module

**File**: `src/websocket/server.ts`

```typescript
import { WebSocketServer } from 'ws';
import { applyWSSHandler } from '@trpc/server/adapters/ws';
import { appRouter } from '../routers';
import { createContext } from '../context';
import type { IncomingMessage } from 'http';

export function createWebSocketServer(port: number = 3001) {
  console.log(`🔌 Creating WebSocket server on port ${port}...`);
  
  const wss = new WebSocketServer({
    port,
    perMessageDeflate: false, // Disable compression for lower latency
  });

  // Apply tRPC WebSocket handler
  const handler = applyWSSHandler({
    wss,
    router: appRouter,
    createContext: async ({ req }: { req: IncomingMessage }) => {
      // Create context with authentication
      return createContext({ req, res: null as any });
    },
  });

  // Connection logging
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

  // Server error handling
  wss.on('error', (error) => {
    console.error('❌ WebSocket server error:', error);
  });

  console.log(`✅ WebSocket server running on ws://localhost:${port}`);

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

---

### 3. Create Context Helper

**File**: `src/websocket/context.ts`

```typescript
import type { IncomingMessage } from 'http';
import { TRPCError } from '@trpc/server';
import { verifyToken } from '../utils/auth';

export async function createWebSocketContext({
  req,
}: {
  req: IncomingMessage;
}) {
  // Extract token from query string or headers
  const url = new URL(req.url || '', `http://${req.headers.host}`);
  const token = url.searchParams.get('token') || req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return { userId: null };
  }

  try {
    const payload = verifyToken(token);
    return { userId: payload.userId };
  } catch (error) {
    console.error('Invalid WebSocket token:', error);
    return { userId: null };
  }
}
```

---

### 4. Update Main Server File

**File**: `src/index.ts`

```typescript
import express from 'express';
import cors from 'cors';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { appRouter } from './routers';
import { createContext } from './types/context';
import { createWebSocketServer } from './websocket/server';
import { initializeDatabase } from './db';

const app = express();
const HTTP_PORT = process.env.PORT || 3000;
const WS_PORT = process.env.WS_PORT || 3001;

// Middleware
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());

// tRPC HTTP middleware
app.use(
  '/trpc',
  createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start servers
async function start() {
  try {
    // Initialize database
    await initializeDatabase();

    // Start HTTP server
    app.listen(HTTP_PORT, () => {
      console.log(`🚀 HTTP server running on http://localhost:${HTTP_PORT}`);
    });

    // Start WebSocket server
    const { wss } = createWebSocketServer(Number(WS_PORT));

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      console.log('SIGTERM received, shutting down gracefully...');
      wss.close(() => {
        console.log('WebSocket server closed');
        process.exit(0);
      });
    });
  } catch (error) {
    console.error('Failed to start servers:', error);
    process.exit(1);
  }
}

start();
```

---

### 5. Update Package.json Scripts

**File**: `package.json`

```json
{
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "dev:http": "PORT=3000 tsx watch src/index.ts",
    "dev:ws": "WS_PORT=3001 tsx watch src/index.ts",
    "test:ws": "curl --include --no-buffer --header 'Connection: Upgrade' --header 'Upgrade: websocket' --header 'Sec-WebSocket-Key: SGVsbG8sIHdvcmxkIQ==' --header 'Sec-WebSocket-Version: 13' http://localhost:3001/"
  }
}
```

---

### 6. Add Environment Variables

**File**: `.env`

```env
# WebSocket Configuration
WS_PORT=3001
WS_ENABLED=true
```

---

### 7. Update tRPC Context Type

**File**: `src/types/context.ts`

Ensure the context type supports both HTTP and WebSocket:

```typescript
import type { Request, Response } from 'express';
import type { IncomingMessage } from 'http';

export type CreateContextOptions = {
  req: Request | IncomingMessage;
  res?: Response;
};

export async function createContext({ req, res }: CreateContextOptions) {
  // Extract user ID from JWT token
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  let userId: number | null = null;
  if (token) {
    try {
      const payload = verifyToken(token);
      userId = payload.userId;
    } catch (error) {
      console.error('Invalid token:', error);
    }
  }

  return { userId, req, res };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
```

---

## Testing Steps

### 1. Start the Server

```bash
npm run dev
```

**Expected Output:**
```
🚀 HTTP server running on http://localhost:3000
🔌 Creating WebSocket server on port 3001...
✅ WebSocket server running on ws://localhost:3001
```

### 2. Test WebSocket Connection (Manual)

Use a WebSocket client tool or browser console:

```javascript
const ws = new WebSocket('ws://localhost:3001');

ws.onopen = () => {
  console.log('Connected!');
};

ws.onmessage = (event) => {
  console.log('Received:', event.data);
};

ws.onerror = (error) => {
  console.error('Error:', error);
};
```

### 3. Test tRPC Subscription

```bash
# Install wscat for testing
npm install -g wscat

# Connect and test
wscat -c ws://localhost:3001
```

### 4. Check Logs

Verify you see connection logs:
```
✅ WebSocket client connected from ::1
❌ WebSocket client disconnected from ::1
```

---

## Acceptance Criteria

- [ ] `ws` package installed and configured
- [ ] WebSocket server runs on port 3001
- [ ] Can connect via `ws://localhost:3001`
- [ ] Connection/disconnection logged in console
- [ ] tRPC handler integrated
- [ ] Context creation works for WebSocket
- [ ] No errors on server startup
- [ ] Health check endpoint still works

---

## Troubleshooting

### Issue: Port already in use
**Solution:** Change WS_PORT in .env or kill process using port 3001

### Issue: Connection refused
**Solution:** Ensure firewall allows port 3001 or use different port

### Issue: CORS errors
**Solution:** WebSocket doesn't use CORS, check authentication instead

### Issue: Context is null
**Solution:** Verify token is passed via query param: `?token=YOUR_TOKEN`

---

## Files Created

- [x] `src/websocket/server.ts` - WebSocket server setup
- [x] `src/websocket/context.ts` - WebSocket context helper

## Files Modified

- [x] `src/index.ts` - Add WebSocket server
- [x] `src/types/context.ts` - Update context type
- [x] `package.json` - Add dependencies and scripts
- [x] `.env` - Add WS_PORT

---

## Next Steps

Once Phase 1 is complete:
- ✅ WebSocket server is running
- ✅ Can accept connections
- → Move to **Phase 2**: Update Message Subscriptions

---

## Status

**Current Status**: ⏳ To Do  
**Last Updated**: 2025-12-31
