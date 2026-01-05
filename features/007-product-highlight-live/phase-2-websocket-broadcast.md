# Phase 2: Backend - WebSocket Real-time Broadcast

**Status**: 🔲 Not Started  
**Estimated Time**: 2 hours  
**Dependencies**: Phase 1 (tRPC endpoints must be complete)

---

## Objective

Implement real-time broadcasting of product highlight/unhighlight events to all connected users in a channel via WebSocket.

---

## Files to Create/Modify

### New Files
- `src/websocket/types/highlightMessages.ts` (or add to existing message types)

### Modified Files
- `src/server/routers/channel.ts` - Emit WebSocket events after highlight/unhighlight
- `src/websocket/handlers.ts` - Send current highlight state on channel join
- `client/src/lib/websocket.ts` (for Phase 5 - frontend listeners)

---

## Steps

### Step 1: Define WebSocket Message Types (20 min)

**Location**: `src/websocket/types/highlightMessages.ts` or similar

```typescript
// Server → Client: Product highlighted
export interface ProductHighlightedMessage {
  type: 'PRODUCT_HIGHLIGHTED';
  channelId: number;
  product: {
    id: number;
    name: string;
    price: number;
    description: string;
    imageUrl: string | null;
  };
  highlightedAt: Date;
}

// Server → Client: Product unhighlighted
export interface ProductUnhighlightedMessage {
  type: 'PRODUCT_UNHIGHLIGHTED';
  channelId: number;
}

// Add to existing message union type
export type WebSocketMessage = 
  | ChatMessage
  | UserJoinedMessage
  | UserLeftMessage
  | ProductHighlightedMessage  // NEW
  | ProductUnhighlightedMessage // NEW
  | ... // other existing types
```

---

### Step 2: Emit WebSocket Event on Highlight (30 min)

**Location**: `src/server/routers/channel.ts` (in `highlightProduct` mutation)

```typescript
// Inside highlightProduct mutation, after database update:

highlightProduct: protectedProcedure
  .input(z.object({
    channelId: z.number(),
    productId: z.number()
  }))
  .mutation(async ({ ctx, input }) => {
    // ... existing validation logic ...
    
    // Update database
    await ctx.db
      .updateTable('channels')
      .set({
        highlightedProductId: input.productId,
        highlightedAt: new Date()
      })
      .where('id', '=', input.channelId)
      .execute();
    
    // Fetch product details
    const product = await ctx.db
      .selectFrom('products')
      .selectAll()
      .where('id', '=', input.productId)
      .executeTakeFirstOrThrow();
    
    // Broadcast to all users in channel
    broadcastToChannel(input.channelId, {
      type: 'PRODUCT_HIGHLIGHTED',
      channelId: input.channelId,
      product: {
        id: product.id,
        name: product.name,
        price: product.price,
        description: product.description,
        imageUrl: product.imageUrl
      },
      highlightedAt: new Date()
    });
    
    return { success: true, product };
  })
```

---

### Step 3: Emit WebSocket Event on Unhighlight (20 min)

**Location**: `src/server/routers/channel.ts` (in `unhighlightProduct` mutation)

```typescript
// Inside unhighlightProduct mutation, after database update:

unhighlightProduct: protectedProcedure
  .input(z.object({
    channelId: z.number()
  }))
  .mutation(async ({ ctx, input }) => {
    // ... existing validation logic ...
    
    // Update database
    await ctx.db
      .updateTable('channels')
      .set({
        highlightedProductId: null,
        highlightedAt: null
      })
      .where('id', '=', input.channelId)
      .execute();
    
    // Broadcast to all users in channel
    broadcastToChannel(input.channelId, {
      type: 'PRODUCT_UNHIGHLIGHTED',
      channelId: input.channelId
    });
    
    return { success: true };
  })
```

---

### Step 4: Create Channel Broadcasting Helper (30 min)

**Location**: `src/websocket/utils.ts` or similar

```typescript
import { WebSocketServer } from 'ws';
import { WebSocketMessage } from './types/highlightMessages';

// Assuming you have a global WebSocket server instance
// and a way to track which users are in which channels

export function broadcastToChannel(
  channelId: number,
  message: WebSocketMessage
): void {
  // Get all WebSocket connections for users in this channel
  const channelConnections = getChannelConnections(channelId);
  
  const messageStr = JSON.stringify(message);
  
  channelConnections.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(messageStr);
    }
  });
}

// Helper to get all connections in a channel
function getChannelConnections(channelId: number): Set<WebSocket> {
  // This depends on your WebSocket architecture
  // You may already have a map of channelId → Set<WebSocket>
  // Example:
  return channelConnectionsMap.get(channelId) || new Set();
}
```

**Note**: Adapt this to your existing WebSocket server setup.

---

### Step 5: Send Current Highlight on Channel Join (30 min)

**Location**: `src/websocket/handlers.ts` (or where you handle channel join events)

When a user joins a channel, send the current highlighted product (if any):

```typescript
// When user joins channel (after Agora join success):
async function handleChannelJoin(
  ws: WebSocket,
  userId: number,
  channelId: number
) {
  // ... existing join logic (add to participants, etc.) ...
  
  // Fetch current highlighted product
  const channel = await db
    .selectFrom('channels')
    .select(['highlightedProductId', 'highlightedAt'])
    .where('id', '=', channelId)
    .executeTakeFirst();
  
  if (channel?.highlightedProductId) {
    const product = await db
      .selectFrom('products')
      .selectAll()
      .where('id', '=', channel.highlightedProductId)
      .executeTakeFirst();
    
    if (product) {
      // Send current highlight to the new joiner
      ws.send(JSON.stringify({
        type: 'PRODUCT_HIGHLIGHTED',
        channelId,
        product: {
          id: product.id,
          name: product.name,
          price: product.price,
          description: product.description,
          imageUrl: product.imageUrl
        },
        highlightedAt: channel.highlightedAt
      }));
    }
  }
}
```

---

### Step 6: Update WebSocket Connection Tracking (10 min)

Ensure your WebSocket server tracks which users are in which channels:

```typescript
// Global map: channelId → Set<WebSocket>
const channelConnectionsMap = new Map<number, Set<WebSocket>>();

// When user joins channel:
function addUserToChannel(channelId: number, ws: WebSocket) {
  if (!channelConnectionsMap.has(channelId)) {
    channelConnectionsMap.set(channelId, new Set());
  }
  channelConnectionsMap.get(channelId)!.add(ws);
}

// When user leaves channel:
function removeUserFromChannel(channelId: number, ws: WebSocket) {
  const connections = channelConnectionsMap.get(channelId);
  if (connections) {
    connections.delete(ws);
    if (connections.size === 0) {
      channelConnectionsMap.delete(channelId);
    }
  }
}
```

**Note**: This may already exist in your WebSocket setup for chat messages.

---

## Testing Checklist

- [ ] `PRODUCT_HIGHLIGHTED` message sent to all users when SELLER highlights
- [ ] `PRODUCT_UNHIGHLIGHTED` message sent to all users when SELLER unhighlights
- [ ] New joiners receive current highlight state immediately after joining
- [ ] Messages are only sent to users in the specific channel (not broadcast globally)
- [ ] WebSocket connections are properly tracked per channel
- [ ] Highlight messages include all required product fields
- [ ] Messages serialize/deserialize correctly (Date → ISO string)

---

## Acceptance Criteria

✅ WebSocket message types defined for highlight/unhighlight events  
✅ Broadcasting helper sends messages to all channel participants  
✅ Highlight event emitted after successful `highlightProduct` mutation  
✅ Unhighlight event emitted after successful `unhighlightProduct` mutation  
✅ New channel joiners receive current highlight state on join  
✅ Messages only sent to users in the relevant channel  
✅ WebSocket connection tracking per channel is functional  

---

## Notes

- Test with multiple browser tabs to simulate multiple users
- Consider rate limiting to prevent spam highlighting
- Ensure WebSocket message order is preserved
- Handle WebSocket disconnection/reconnection gracefully (client will refetch on reconnect)
