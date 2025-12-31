# Phase 3: Client WebSocket Integration

**Estimated Time**: 1-1.5 hours  
**Status**: ⏳ To Do  
**Dependencies**: Phase 1 & 2 completed

---

## Objective

Configure the React client to use WebSocket for subscriptions while keeping HTTP for queries and mutations.

---

## Tasks

### 1. Update tRPC Client Configuration

**File**: `client/src/lib/trpc.ts`

```typescript
import { createTRPCReact, httpBatchLink, wsLink, splitLink } from '@trpc/client';
import { createWSClient } from '@trpc/client';
import type { AppRouter } from '../../../src/routers';

// Create WebSocket client
const wsClient = createWSClient({
  url: import.meta.env.VITE_WS_URL || 'ws://localhost:3001',
  
  // Reconnection configuration
  retryDelayMs: (attemptIndex) => {
    // Exponential backoff: 1s, 2s, 4s, 8s, max 10s
    return Math.min(1000 * 2 ** attemptIndex, 10000);
  },
  
  // Connection hooks
  onOpen: () => {
    console.log('✅ WebSocket connected');
  },
  onClose: () => {
    console.log('❌ WebSocket disconnected');
  },
  
  // Send authentication token with connection
  connectionParams: () => {
    const token = localStorage.getItem('token');
    return { token };
  },
});

// Create tRPC React client
export const trpc = createTRPCReact<AppRouter>();

// Create tRPC client
export const trpcClient = trpc.createClient({
  links: [
    // Split link: WebSocket for subscriptions, HTTP for everything else
    splitLink({
      condition: (op) => op.type === 'subscription',
      
      // WebSocket link for subscriptions
      true: wsLink({
        client: wsClient,
      }),
      
      // HTTP link for queries and mutations
      false: httpBatchLink({
        url: import.meta.env.VITE_API_URL || 'http://localhost:3000/trpc',
        
        // Add auth token to headers
        headers: () => {
          const token = localStorage.getItem('token');
          return token ? { authorization: `Bearer ${token}` } : {};
        },
      }),
    }),
  ],
});

// Export WebSocket client for status monitoring
export { wsClient };
```

---

### 2. Create WebSocket Status Hook

**File**: `client/src/hooks/useWebSocketStatus.ts`

```typescript
import { useState, useEffect } from 'react';
import { wsClient } from '../lib/trpc';

export type WebSocketStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

export function useWebSocketStatus() {
  const [status, setStatus] = useState<WebSocketStatus>('connecting');
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const ws = (wsClient as any).getConnection();
    
    if (!ws) {
      setStatus('disconnected');
      return;
    }

    const handleOpen = () => {
      setStatus('connected');
      setIsConnected(true);
      console.log('🟢 WebSocket connected');
    };

    const handleClose = () => {
      setStatus('disconnected');
      setIsConnected(false);
      console.log('🔴 WebSocket disconnected');
    };

    const handleError = () => {
      setStatus('error');
      setIsConnected(false);
      console.log('⚠️ WebSocket error');
    };

    // Check current state
    if (ws.readyState === WebSocket.OPEN) {
      setStatus('connected');
      setIsConnected(true);
    } else if (ws.readyState === WebSocket.CONNECTING) {
      setStatus('connecting');
    } else {
      setStatus('disconnected');
    }

    // Listen to events
    ws.addEventListener('open', handleOpen);
    ws.addEventListener('close', handleClose);
    ws.addEventListener('error', handleError);

    return () => {
      ws.removeEventListener('open', handleOpen);
      ws.removeEventListener('close', handleClose);
      ws.removeEventListener('error', handleError);
    };
  }, []);

  return { status, isConnected };
}
```

---

### 3. Update ChatPanel to Use WebSocket Subscription

**File**: `client/src/components/ChatPanel/ChatPanel.tsx`

```typescript
import { useEffect, useState } from 'react';
import { trpc } from '@/lib/trpc';
import { MessageList } from '../MessageList';
import { MessageInput } from '../MessageInput';
import { MessageCircle, Wifi, WifiOff } from 'lucide-react';
import { toast } from 'sonner';
import { useWebSocketStatus } from '@/hooks/useWebSocketStatus';

interface ChatPanelProps {
  channelId: number;
  currentUserId: number;
}

export function ChatPanel({ channelId, currentUserId }: ChatPanelProps) {
  const [messages, setMessages] = useState<any[]>([]);
  const { isConnected } = useWebSocketStatus();

  // Fetch message history via HTTP
  const { data: messageHistory, isLoading } = trpc.message.list.useQuery({
    channelId,
    limit: 100,
  });

  // Real-time subscription via WebSocket
  trpc.message.subscribe.useSubscription(
    { channelId },
    {
      enabled: isConnected, // Only subscribe when WebSocket is connected
      onData: (newMessage) => {
        console.log('📨 Received real-time message:', newMessage);
        
        // Add message if not already in list (avoid duplicates)
        setMessages((prev) => {
          const exists = prev.some((m) => m.id === newMessage.id);
          if (exists) return prev;
          return [...prev, newMessage];
        });
      },
      onError: (error) => {
        console.error('❌ Subscription error:', error);
        toast.error('Connection lost. Trying to reconnect...');
      },
    }
  );

  // Send message mutation (still uses HTTP)
  const sendMessageMutation = trpc.message.send.useMutation({
    onSuccess: (data) => {
      // Optimistically add message (will also come via subscription)
      setMessages((prev) => {
        const exists = prev.some((m) => m.id === data.id);
        if (exists) return prev;
        return [...prev, data];
      });
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to send message');
    },
  });

  // Initialize messages from history
  useEffect(() => {
    if (messageHistory) {
      setMessages(messageHistory);
    }
  }, [messageHistory]);

  const handleSendMessage = (content: string) => {
    sendMessageMutation.mutate({
      channelId,
      content,
    });
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header with Connection Status */}
      <div className="flex items-center gap-2 p-3 border-b bg-card shrink-0">
        <MessageCircle className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-sm">Chat</h3>
        
        {/* Connection indicator */}
        {isConnected ? (
          <Wifi className="w-4 h-4 text-green-500 ml-auto" title="Connected" />
        ) : (
          <WifiOff className="w-4 h-4 text-red-500 ml-auto animate-pulse" title="Disconnected" />
        )}
        
        <span className="text-xs text-muted-foreground">
          {messages.length} {messages.length === 1 ? 'message' : 'messages'}
        </span>
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-hidden">
        <MessageList
          messages={messages}
          currentUserId={currentUserId}
          isLoading={isLoading}
        />
      </div>

      {/* Message Input */}
      <div className="shrink-0">
        <MessageInput
          onSendMessage={handleSendMessage}
          disabled={sendMessageMutation.isLoading || !isConnected}
        />
      </div>
    </div>
  );
}
```

---

### 4. Add Environment Variables

**File**: `client/.env`

```env
VITE_API_URL=http://localhost:3000/trpc
VITE_WS_URL=ws://localhost:3001
```

**File**: `client/.env.production`

```env
VITE_API_URL=https://api.whynot.com/trpc
VITE_WS_URL=wss://ws.whynot.com
```

---

### 5. Add Connection Status Banner (Optional)

**File**: `client/src/components/ConnectionStatus/ConnectionStatus.tsx`

```typescript
import { useWebSocketStatus } from '@/hooks/useWebSocketStatus';
import { AlertCircle, Wifi } from 'lucide-react';

export function ConnectionStatus() {
  const { status } = useWebSocketStatus();

  if (status === 'connected') {
    return null; // Don't show anything when connected
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-500 text-white py-2 px-4 text-center text-sm flex items-center justify-center gap-2">
      {status === 'connecting' ? (
        <>
          <Wifi className="w-4 h-4 animate-pulse" />
          Connecting to server...
        </>
      ) : (
        <>
          <AlertCircle className="w-4 h-4" />
          Connection lost. Reconnecting...
        </>
      )}
    </div>
  );
}
```

Add to `App.tsx`:

```typescript
import { ConnectionStatus } from './components/ConnectionStatus';

function App() {
  return (
    <>
      <ConnectionStatus />
      {/* Rest of app */}
    </>
  );
}
```

---

### 6. Update Main.tsx to Provide tRPC Client

**File**: `client/src/main.tsx`

```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { trpc, trpcClient } from './lib/trpc';
import App from './App';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </QueryClientProvider>
    </trpc.Provider>
  </React.StrictMode>
);
```

---

## Testing Steps

### 1. Start Both Servers

Terminal 1 - Backend:
```bash
npm run dev
```

Terminal 2 - Frontend:
```bash
cd client && npm run dev
```

### 2. Open Multiple Browser Tabs

Open 2-3 tabs to `http://localhost:5173` and join the same channel.

### 3. Send a Message

Send a message from one tab and verify it appears **instantly** in all other tabs.

**Expected:**
- Message appears in < 100ms
- All tabs receive the same message
- No duplicate messages

### 4. Test Disconnection

1. Stop the backend server
2. Observe connection indicator turns red
3. Try to send a message (should be disabled)
4. Restart backend server
5. Verify it reconnects automatically

### 5. Test Network Interruption

1. Open DevTools → Network tab
2. Set throttling to "Offline"
3. Wait a few seconds
4. Set back to "Online"
5. Verify reconnection happens

### 6. Check Browser Console

Should see:
```
✅ WebSocket connected
📨 Received real-time message: { ... }
```

---

## Debugging Tips

### Enable tRPC Debug Logging

```typescript
// client/src/lib/trpc.ts
const trpcClient = trpc.createClient({
  links: [
    loggerLink({
      enabled: () => true,
      console: console,
    }),
    splitLink({ /* ... */ }),
  ],
});
```

### Check WebSocket Connection in DevTools

1. Open DevTools → Network tab
2. Filter by "WS" (WebSocket)
3. Click on connection
4. View "Messages" tab to see data flow

### Test WebSocket URL

```javascript
// Browser console
const ws = new WebSocket('ws://localhost:3001');
ws.onopen = () => console.log('Connected!');
ws.onerror = (e) => console.error('Error:', e);
```

---

## Performance Optimizations

### Debounce Subscription Updates

Prevent UI thrashing with many rapid messages:

```typescript
const [messages, setMessages] = useState<any[]>([]);
const [pendingMessages, setPendingMessages] = useState<any[]>([]);

useEffect(() => {
  const timer = setTimeout(() => {
    if (pendingMessages.length > 0) {
      setMessages((prev) => [...prev, ...pendingMessages]);
      setPendingMessages([]);
    }
  }, 100);
  
  return () => clearTimeout(timer);
}, [pendingMessages]);
```

### Subscription Cleanup

Ensure subscriptions are cleaned up:

```typescript
useEffect(() => {
  const subscription = trpc.message.subscribe.useSubscription(/* ... */);
  
  return () => {
    subscription?.unsubscribe?.();
  };
}, [channelId]);
```

---

## Acceptance Criteria

- [ ] Client connects to WebSocket on mount
- [ ] `useSubscription` receives real-time messages
- [ ] Connection status indicator works
- [ ] Reconnects automatically on disconnect
- [ ] Falls back gracefully if WebSocket fails
- [ ] Multiple tabs receive same messages
- [ ] No duplicate messages
- [ ] Send button disabled when disconnected
- [ ] Console shows connection status

---

## Files Created

- [x] `client/src/hooks/useWebSocketStatus.ts` - Connection status hook
- [ ] `client/src/components/ConnectionStatus/ConnectionStatus.tsx` - Status banner (optional)
- [x] `client/.env` - Environment variables

## Files Modified

- [x] `client/src/lib/trpc.ts` - Add wsLink and splitLink
- [x] `client/src/components/ChatPanel/ChatPanel.tsx` - Use WebSocket subscription
- [x] `client/src/main.tsx` - Update tRPC provider

---

## Next Steps

Once Phase 3 is complete:
- ✅ Client receives real-time updates
- ✅ WebSocket connection is stable
- → Move to **Phase 4**: Testing & Polish

---

## Status

**Current Status**: ⏳ To Do  
**Last Updated**: 2025-12-31
