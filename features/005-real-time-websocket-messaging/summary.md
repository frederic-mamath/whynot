# Feature 005: Real-Time WebSocket Messaging

**Feature ID**: 005  
**Feature Name**: Real-Time WebSocket Messaging  
**Status**: 📋 Planning  
**Priority**: High  
**Estimated Effort**: 3-4 hours  
**Dependencies**: Feature 004 (Messaging UI)

---

## Overview

Upgrade the current HTTP-based messaging system to use WebSockets for true real-time communication. This enables instant message delivery, presence detection, typing indicators, and other real-time features.

---

## Current State (Feature 004)

### What We Have ✅
- Message database schema
- Message CRUD API (tRPC)
- Message UI components (ChatPanel, MessageInput, etc.)
- Basic EventEmitter-based subscriptions
- HTTP polling for message updates

### Limitations ❌
- **Not truly real-time** - Messages don't appear instantly
- **Polling overhead** - Client constantly queries server
- **Single server only** - EventEmitter doesn't work across multiple servers
- **No presence** - Can't detect online/offline users
- **No typing indicators** - Can't show "User is typing..."
- **Higher latency** - Delay between message send and receive

---

## Goals

### Primary Goals
1. **Instant message delivery** - Sub-second latency
2. **Bidirectional communication** - Server can push to clients
3. **Type-safe WebSockets** - Use tRPC subscriptions over WebSocket
4. **Scalable foundation** - Easy to add Redis later for multi-server
5. **Graceful degradation** - Fall back to HTTP if WebSocket fails

### Secondary Goals (Future Enhancements)
- User presence (online/offline/away)
- Typing indicators
- Read receipts
- Message reactions
- Delivery confirmations

---

## Technical Architecture

### Technology Stack

**Backend:**
- `ws` - WebSocket server library
- `@trpc/server` - Already installed, supports WebSocket
- tRPC `applyWSSHandler` - WebSocket handler
- EventEmitter → Redis (future scaling)

**Frontend:**
- `@trpc/client` - Already installed
- `wsLink` - tRPC WebSocket transport
- `httpBatchLink` - Fallback for queries/mutations
- Auto-reconnection logic

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                       CLIENT (Browser)                       │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  tRPC Client                                                 │
│  ├── wsLink (subscriptions) ────────┐                       │
│  └── httpBatchLink (queries/mutations)                      │
│                                       │                       │
└───────────────────────────────────────┼───────────────────────┘
                                        │
                                        │ WebSocket (wss://)
                                        │
┌───────────────────────────────────────▼───────────────────────┐
│                       SERVER (Node.js)                        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Express HTTP Server (port 3000)                             │
│  └── tRPC HTTP Handler (queries/mutations)                  │
│                                                               │
│  WebSocket Server (port 3001)                                │
│  └── tRPC WS Handler (subscriptions)                        │
│      └── message.subscribe                                   │
│          └── EventEmitter (in-memory pub/sub)               │
│              └── Emit on message.send                        │
│                                                               │
├─────────────────────────────────────────────────────────────┤
│                      PostgreSQL Database                      │
└─────────────────────────────────────────────────────────────┘
```

### Message Flow

```
1. User sends message:
   Client → HTTP POST → tRPC message.send → Database → EventEmitter.emit()

2. Real-time delivery:
   EventEmitter.emit() → WebSocket connections → All subscribed clients

3. Message appears:
   Client receives via WebSocket → Updates UI (no polling!)
```

---

## Implementation Phases

### Phase 1: WebSocket Server Setup (1-1.5h)
**Goal**: Set up WebSocket server alongside Express

**Tasks:**
- Install dependencies (`ws`, types)
- Create WebSocket server on separate port
- Configure tRPC `applyWSSHandler`
- Add WebSocket server to `src/index.ts`
- Test basic WebSocket connection

**Files to Create:**
- `src/websocket/server.ts` - WebSocket server setup
- `src/websocket/handler.ts` - tRPC WebSocket handler

**Files to Modify:**
- `src/index.ts` - Add WebSocket server
- `package.json` - Add dependencies

**Acceptance Criteria:**
- [ ] WebSocket server runs on port 3001
- [ ] Can connect via `ws://localhost:3001`
- [ ] tRPC handler accepts connections
- [ ] Console logs WebSocket connections

---

### Phase 2: Update Message Subscriptions (1h)
**Goal**: Make message.subscribe work over WebSocket

**Tasks:**
- Keep existing EventEmitter for now (simple)
- Ensure message.send emits to EventEmitter
- Test subscription receives events
- Add connection authentication

**Files to Modify:**
- `src/routers/message.ts` - Ensure proper event emission
- No changes needed if already emitting correctly

**Acceptance Criteria:**
- [ ] message.subscribe receives events via WebSocket
- [ ] Multiple clients can subscribe to same channel
- [ ] Events are delivered instantly (<100ms)
- [ ] Authentication works over WebSocket

---

### Phase 3: Client WebSocket Integration (1-1.5h)
**Goal**: Connect client to WebSocket server

**Tasks:**
- Add `wsLink` to tRPC client configuration
- Configure split link (WS for subscriptions, HTTP for queries/mutations)
- Update ChatPanel to use WebSocket subscription
- Add connection status indicator
- Handle reconnection automatically

**Files to Modify:**
- `client/src/lib/trpc.ts` - Add wsLink
- `client/src/components/ChatPanel/ChatPanel.tsx` - Use subscription

**Files to Create:**
- `client/src/hooks/useWebSocketStatus.ts` - Connection status hook

**Acceptance Criteria:**
- [ ] Client connects to WebSocket on mount
- [ ] Subscriptions receive real-time updates
- [ ] Reconnects automatically on disconnect
- [ ] Connection status visible in UI
- [ ] Falls back to HTTP if WebSocket fails

---

### Phase 4: Testing & Polish (0.5-1h)
**Goal**: Ensure reliability and UX

**Tasks:**
- Test with multiple browsers/tabs
- Test reconnection scenarios
- Test network interruptions
- Add error handling
- Add loading states
- Performance optimization

**Acceptance Criteria:**
- [ ] Messages arrive in < 100ms
- [ ] Multiple users can chat simultaneously
- [ ] Handles disconnections gracefully
- [ ] No duplicate messages
- [ ] Memory leaks checked
- [ ] Console errors handled

---

## Detailed Technical Specs

### WebSocket Server Configuration

```typescript
// src/websocket/server.ts
import { WebSocketServer } from 'ws';
import { applyWSSHandler } from '@trpc/server/adapters/ws';
import { appRouter } from '../routers';
import { createContext } from '../trpc';

export function createWebSocketServer() {
  const wss = new WebSocketServer({ port: 3001 });
  
  const handler = applyWSSHandler({
    wss,
    router: appRouter,
    createContext,
  });

  wss.on('connection', (ws) => {
    console.log('WebSocket client connected');
    
    ws.on('close', () => {
      console.log('WebSocket client disconnected');
    });
  });

  return { wss, handler };
}
```

### Client Configuration

```typescript
// client/src/lib/trpc.ts
import { createWSClient, wsLink, splitLink, httpBatchLink } from '@trpc/client';

const wsClient = createWSClient({
  url: 'ws://localhost:3001',
  retryDelayMs: () => 1000, // Reconnect after 1s
});

export const trpc = createTRPCReact<AppRouter>({
  links: [
    splitLink({
      // Use WebSocket for subscriptions
      condition: (op) => op.type === 'subscription',
      true: wsLink({ client: wsClient }),
      // Use HTTP for queries and mutations
      false: httpBatchLink({ url: 'http://localhost:3000/trpc' }),
    }),
  ],
});
```

### Updated ChatPanel with Real-Time

```typescript
// client/src/components/ChatPanel/ChatPanel.tsx
export function ChatPanel({ channelId, currentUserId }: ChatPanelProps) {
  const [messages, setMessages] = useState<any[]>([]);

  // Initial load via HTTP
  const { data: messageHistory } = trpc.message.list.useQuery({
    channelId,
    limit: 100,
  });

  // Real-time updates via WebSocket
  trpc.message.subscribe.useSubscription(
    { channelId },
    {
      onData: (newMessage) => {
        setMessages((prev) => [...prev, newMessage]);
      },
      onError: (err) => {
        console.error('Subscription error:', err);
      },
    }
  );

  // ... rest of component
}
```

---

## Environment Configuration

### Backend Environment Variables

```env
# .env
WS_PORT=3001  # WebSocket server port
WS_ENABLED=true  # Enable/disable WebSocket
```

### Frontend Environment Variables

```env
# client/.env
VITE_WS_URL=ws://localhost:3001  # WebSocket URL
VITE_HTTP_URL=http://localhost:3000  # HTTP API URL
```

---

## Migration Strategy

### Backward Compatibility
✅ **Zero breaking changes** - Existing HTTP API remains functional

### Deployment Steps
1. Deploy backend with WebSocket server
2. Deploy frontend with WebSocket client
3. Monitor connection metrics
4. Gradually migrate users to WebSocket
5. Keep HTTP fallback indefinitely

### Rollback Plan
- Disable WebSocket via environment variable
- Client automatically falls back to HTTP
- No data loss

---

## Performance Metrics

### Success Criteria
- **Latency**: < 100ms message delivery
- **Throughput**: Handle 100+ concurrent connections per server
- **Reliability**: 99.9% message delivery
- **Reconnection**: < 3 seconds to reconnect

### Monitoring
- WebSocket connection count
- Message delivery time
- Reconnection frequency
- Error rate
- Memory usage

---

## Security Considerations

### Authentication
- Reuse existing JWT token authentication
- Validate token on WebSocket connection
- Close connection if token expires

### Rate Limiting
- Keep existing 10 messages/minute limit
- Prevent WebSocket abuse (connection spam)
- Limit subscriptions per user

### Input Validation
- Reuse existing sanitization (already in place)
- Validate all incoming WebSocket messages
- Prevent XSS/injection attacks

---

## Future Enhancements (Not in Scope)

### Phase 5: Redis Pub/Sub (Multi-Server Scaling)
- Replace EventEmitter with Redis
- Enable horizontal scaling
- ~2-3 hours additional work

### Phase 6: Advanced Features
- User presence (online/offline)
- Typing indicators
- Read receipts  
- Message reactions
- Delivery confirmations

---

## Testing Strategy

### Unit Tests
- WebSocket server setup
- Connection handling
- Event emission
- Subscription management

### Integration Tests
- End-to-end message flow
- Multiple concurrent connections
- Reconnection scenarios
- Error handling

### Manual Testing
- Multiple browsers
- Network interruptions (disable WiFi)
- Server restarts
- High message volume

---

## Dependencies

### NPM Packages to Install

**Backend:**
```json
{
  "ws": "^8.14.2",
  "@types/ws": "^8.5.10"
}
```

**Frontend:**
- No additional packages (tRPC already supports WebSocket)

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| WebSocket blocked by firewall | High | HTTP fallback built-in |
| Connection instability | Medium | Auto-reconnection + buffering |
| Server memory issues | Medium | Connection limits + monitoring |
| Token expiration | Low | Refresh logic on reconnect |
| Browser compatibility | Low | Modern browsers all support WS |

---

## Success Metrics

### User Experience
- ✅ Messages appear instantly (no refresh needed)
- ✅ No noticeable lag between users
- ✅ Smooth reconnection (transparent to user)
- ✅ No duplicate messages

### Technical
- ✅ < 100ms message latency
- ✅ 99%+ WebSocket uptime
- ✅ < 5% HTTP fallback usage
- ✅ Zero breaking changes

---

## Timeline

| Phase | Duration | Start | End |
|-------|----------|-------|-----|
| Phase 1: WebSocket Server | 1-1.5h | - | - |
| Phase 2: Update Subscriptions | 1h | - | - |
| Phase 3: Client Integration | 1-1.5h | - | - |
| Phase 4: Testing & Polish | 0.5-1h | - | - |
| **Total** | **3-4h** | - | - |

---

## Acceptance Criteria

### Must Have
- [x] WebSocket server running on port 3001
- [x] Client connects via wsLink
- [x] Real-time message delivery (< 100ms)
- [x] Auto-reconnection works
- [x] HTTP fallback functional
- [x] Authentication over WebSocket
- [x] No breaking changes to existing API

### Nice to Have
- [ ] Connection status indicator in UI
- [ ] Reconnection notifications
- [ ] Message delivery confirmation
- [ ] Performance metrics dashboard

---

## Related Features

- **Feature 004**: Buyer View & Messaging (foundation)
- **Feature 003**: RBAC (authentication/authorization)
- **Feature 001**: Live Streaming Channels (real-time video)

---

## References

- [tRPC WebSocket Documentation](https://trpc.io/docs/subscriptions)
- [ws Library](https://github.com/websockets/ws)
- [WebSocket Protocol RFC 6455](https://datatracker.ietf.org/doc/html/rfc6455)

---

**Created**: 2025-12-31  
**Last Updated**: 2025-12-31  
**Status**: Planning Phase  
**Next Step**: Begin Phase 1 - WebSocket Server Setup
