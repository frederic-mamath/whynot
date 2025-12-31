# Phase 2: Update Message Subscriptions

**Estimated Time**: 1 hour  
**Actual Time**: ~10 minutes  
**Status**: ✅ Completed  
**Dependencies**: Phase 1 completed

---

## Objective

Ensure the message subscription endpoint works correctly over WebSocket and delivers real-time updates when new messages are sent.

---

## Current State Analysis

From Feature 004, we already have:
- ✅ `message.subscribe` endpoint (uses EventEmitter)
- ✅ `message.send` mutation
- ✅ EventEmitter emits on send

**Current Implementation:**
```typescript
// src/routers/message.ts
const messageEvents = new EventEmitter();

export const messageRouter = router({
  send: protectedProcedure
    .mutation(async ({ ctx, input }) => {
      // ... save message ...
      
      // Emit event
      messageEvents.emit(`channel:${input.channelId}`, messageWithUser);
      
      return messageWithUser;
    }),

  subscribe: publicProcedure
    .subscription(({ input }) => {
      return observable((emit) => {
        const handler = (data) => emit.next(data);
        messageEvents.on(`channel:${input.channelId}`, handler);
        return () => messageEvents.off(`channel:${input.channelId}`, handler);
      });
    }),
});
```

This already works! We just need to verify it works over WebSocket.

---

## Tasks

### 1. Verify Event Emission

Ensure `message.send` emits events correctly:

**File**: `src/routers/message.ts`

```typescript
send: protectedProcedure
  .input(
    z.object({
      channelId: z.number().int().positive(),
      content: z.string().min(1).max(500),
    })
  )
  .mutation(async ({ ctx, input }) => {
    // ... existing validation and save logic ...

    // Prepare message with user info
    const messageWithUser = {
      id: message.id,
      channelId: message.channel_id,
      userId: message.user_id,
      content: message.content,
      createdAt: message.created_at,
      user: {
        id: ctx.user.id,
        email: ctx.user.email,
      },
    };

    // ✅ VERIFY THIS LINE EXISTS
    messageEvents.emit(`channel:${input.channelId}`, messageWithUser);
    
    console.log(`📤 Emitted message to channel:${input.channelId}`);

    return messageWithUser;
  }),
```

### 2. Add Connection Logging to Subscription

Add logging to track subscriptions:

**File**: `src/routers/message.ts`

```typescript
subscribe: publicProcedure
  .input(z.object({ channelId: z.number().int().positive() }))
  .subscription(({ input, ctx }) => {
    console.log(`📡 User ${ctx.userId || 'anonymous'} subscribed to channel:${input.channelId}`);
    
    return observable<any>((emit) => {
      const eventName = `channel:${input.channelId}`;
      
      const handler = (data: any) => {
        console.log(`📨 Sending message to subscriber on ${eventName}`);
        emit.next(data);
      };

      messageEvents.on(eventName, handler);

      // Cleanup on unsubscribe
      return () => {
        console.log(`📴 User unsubscribed from ${eventName}`);
        messageEvents.off(eventName, handler);
      };
    });
  }),
```

### 3. Add EventEmitter Max Listeners Warning Fix

EventEmitter has a default limit of 10 listeners. With many users, this causes warnings.

**File**: `src/routers/message.ts`

```typescript
import { EventEmitter } from 'events';

// Event emitter for real-time message updates
const messageEvents = new EventEmitter();

// Increase max listeners (or set to 0 for unlimited)
messageEvents.setMaxListeners(100); // Adjust based on expected concurrent users

// Or unlimited (use with caution):
// messageEvents.setMaxListeners(0);
```

### 4. Add Heartbeat to Keep Connections Alive

Some networks close idle WebSocket connections. Add heartbeat:

**File**: `src/routers/message.ts`

Add a heartbeat subscription (optional):

```typescript
export const messageRouter = router({
  // ... existing endpoints ...

  // Heartbeat subscription to keep connection alive
  heartbeat: publicProcedure
    .subscription(() => {
      return observable<{ timestamp: number }>((emit) => {
        const interval = setInterval(() => {
          emit.next({ timestamp: Date.now() });
        }, 30000); // Every 30 seconds

        return () => clearInterval(interval);
      });
    }),
});
```

### 5. Test with Multiple Subscriptions

Create a test script to verify multiple clients receive events:

**File**: `test-websocket-subscription.ts`

```typescript
import { createTRPCProxyClient, createWSClient, wsLink } from '@trpc/client';
import type { AppRouter } from './src/routers';

const wsClient = createWSClient({
  url: 'ws://localhost:3001',
});

const client = createTRPCProxyClient<AppRouter>({
  links: [wsLink({ client: wsClient })],
});

async function testSubscription() {
  console.log('🧪 Testing WebSocket subscription...');

  const channelId = 2;

  // Subscribe to messages
  const subscription = client.message.subscribe.subscribe(
    { channelId },
    {
      onData: (message) => {
        console.log('✅ Received message:', message);
      },
      onError: (error) => {
        console.error('❌ Subscription error:', error);
      },
    }
  );

  console.log(`📡 Subscribed to channel ${channelId}`);
  console.log('Waiting for messages... (Ctrl+C to exit)');

  // Keep process alive
  await new Promise(() => {});
}

testSubscription();
```

---

## Testing Steps

### 1. Start the Server

```bash
npm run dev
```

### 2. Test Subscription in Browser Console

Open browser console on `http://localhost:5173`:

```javascript
// This will be done in Phase 3, but you can manually test
const ws = new WebSocket('ws://localhost:3001');

ws.onopen = () => {
  console.log('Connected to WebSocket');
  
  // Subscribe to channel (tRPC format)
  ws.send(JSON.stringify({
    id: 1,
    method: 'subscription',
    params: {
      path: 'message.subscribe',
      input: { channelId: 2 }
    }
  }));
};

ws.onmessage = (event) => {
  console.log('Received:', JSON.parse(event.data));
};
```

### 3. Send a Message via HTTP

While subscription is active, send a message:

```bash
curl -X POST http://localhost:3000/trpc/message.send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "channelId": 2,
    "content": "Test real-time message"
  }'
```

### 4. Verify Message Received

Check that the WebSocket subscription received the message instantly.

**Expected Console Output:**
```
📡 User 1 subscribed to channel:2
📤 Emitted message to channel:2
📨 Sending message to subscriber on channel:2
```

### 5. Test Multiple Connections

Open multiple browser tabs and verify all receive the same message.

---

## Debugging Tips

### Enable Verbose Logging

Add more detailed logging:

```typescript
messageEvents.on('newListener', (event) => {
  console.log(`➕ New listener for: ${event}`);
});

messageEvents.on('removeListener', (event) => {
  console.log(`➖ Removed listener for: ${event}`);
});
```

### Check Event Listeners Count

```typescript
console.log(`👥 Active listeners on channel:2:`, 
  messageEvents.listenerCount('channel:2')
);
```

### Verify EventEmitter Receives Events

```typescript
messageEvents.on('channel:2', (data) => {
  console.log('🔔 EventEmitter received:', data);
});
```

---

## Performance Considerations

### Memory Management

```typescript
// Clean up old event listeners periodically
setInterval(() => {
  const channels = messageEvents.eventNames();
  channels.forEach(channel => {
    const count = messageEvents.listenerCount(channel);
    if (count === 0) {
      messageEvents.removeAllListeners(channel);
      console.log(`🧹 Cleaned up listeners for ${channel}`);
    }
  });
}, 300000); // Every 5 minutes
```

### Monitor EventEmitter

```typescript
// Log EventEmitter stats
setInterval(() => {
  const channels = messageEvents.eventNames();
  console.log(`📊 EventEmitter Stats:`, {
    activeChannels: channels.length,
    totalListeners: channels.reduce((sum, ch) => 
      sum + messageEvents.listenerCount(ch), 0
    ),
  });
}, 60000); // Every minute
```

---

## Acceptance Criteria

- [x] `message.send` emits events to EventEmitter
- [x] `message.subscribe` receives events over WebSocket
- [x] Multiple clients can subscribe to same channel
- [x] All subscribed clients receive messages instantly
- [x] Subscription cleanup works (no memory leaks)
- [x] Max listeners increased to prevent warnings
- [x] Logging shows event flow clearly
- [x] No duplicate messages delivered

---

## Optional Enhancements

### Add Message Delivery Confirmation

```typescript
send: protectedProcedure
  .mutation(async ({ ctx, input }) => {
    // ... save message ...
    
    const listenersCount = messageEvents.listenerCount(`channel:${input.channelId}`);
    console.log(`📊 Delivering to ${listenersCount} subscribers`);
    
    messageEvents.emit(`channel:${input.channelId}`, messageWithUser);
    
    return {
      ...messageWithUser,
      deliveredTo: listenersCount,
    };
  }),
```

### Add Subscription Count Endpoint

```typescript
subscriptionCount: publicProcedure
  .input(z.object({ channelId: z.number() }))
  .query(({ input }) => {
    const count = messageEvents.listenerCount(`channel:${input.channelId}`);
    return { count };
  }),
```

---

## Migration Notes

### No Breaking Changes

The existing EventEmitter-based implementation is fully compatible with WebSocket. No changes needed to the subscription logic itself.

### Future: Redis Migration

When scaling to multiple servers, replace EventEmitter with Redis pub/sub:

```typescript
// Future implementation (not in this phase)
import Redis from 'ioredis';

const publisher = new Redis();
const subscriber = new Redis();

// Replace EventEmitter with Redis
subscriber.subscribe('channel:2');
subscriber.on('message', (channel, message) => {
  // Emit to WebSocket clients
});
```

---

## Files Modified

- [x] `src/routers/message.ts` - Add logging, increase max listeners

## Files Created (Optional)

- [ ] `test-websocket-subscription.ts` - Test script

---

## Next Steps

Once Phase 2 is complete:
- ✅ Subscriptions work over WebSocket
- ✅ Events are delivered in real-time
- → Move to **Phase 3**: Client WebSocket Integration

---

## Status

**Current Status**: ✅ Completed  
**Completion Date**: 2025-12-31  
**Next Phase**: Phase 3 - Client WebSocket Integration
