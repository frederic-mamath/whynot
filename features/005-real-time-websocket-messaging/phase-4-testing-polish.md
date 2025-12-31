# Phase 4: Testing & Polish

**Estimated Time**: 0.5-1 hour  
**Status**: ⏳ To Do  
**Dependencies**: Phases 1, 2, 3 completed

---

## Objective

Thoroughly test the WebSocket implementation, handle edge cases, optimize performance, and polish the user experience.

---

## Testing Checklist

### Functional Testing

#### Basic Functionality
- [ ] Single user can send and receive messages
- [ ] Multiple users receive messages in real-time
- [ ] Message order is correct
- [ ] No duplicate messages appear
- [ ] User info (name, avatar) displays correctly
- [ ] Timestamps are accurate

#### Connection Management
- [ ] Client connects on page load
- [ ] Client reconnects after server restart
- [ ] Client reconnects after network interruption
- [ ] Connection status indicator is accurate
- [ ] Reconnection happens automatically
- [ ] No infinite reconnection loops

#### Error Handling
- [ ] Graceful degradation if WebSocket unavailable
- [ ] Error messages are user-friendly
- [ ] Rate limiting works (10 msg/min)
- [ ] Authentication errors handled properly
- [ ] Invalid messages rejected

#### Performance
- [ ] Messages arrive in < 100ms
- [ ] UI remains responsive with 100+ messages
- [ ] Memory doesn't leak with long sessions
- [ ] CPU usage is reasonable
- [ ] Network usage is efficient

### Cross-Browser Testing

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Mobile Chrome (Android)

### Network Conditions

Test with Chrome DevTools → Network → Throttling:

- [ ] Fast 3G - Messages still arrive
- [ ] Slow 3G - UI shows loading state
- [ ] Offline - Shows disconnected state
- [ ] Online again - Reconnects automatically

---

## Edge Cases to Test

### 1. Rapid Message Sending

```typescript
// Test sending 10 messages in quick succession
for (let i = 0; i < 10; i++) {
  sendMessage(`Test message ${i}`);
}
```

**Expected:**
- Rate limiter kicks in after 10 messages
- User sees rate limit error
- Messages are delivered in order

### 2. Server Restart

1. Send messages
2. Restart backend server
3. Client should reconnect
4. Send another message
5. Should work without manual refresh

### 3. Token Expiration

1. Log in
2. Wait for token to expire (or manually expire it)
3. Try to send message
4. Should prompt to re-login

### 4. Multiple Channels

1. Open channel 1 in tab A
2. Open channel 2 in tab B
3. Send messages in both
4. Verify no cross-contamination

### 5. Long Messages

```typescript
sendMessage('a'.repeat(500)); // Max length
sendMessage('a'.repeat(501)); // Should be rejected
```

### 6. Special Characters

```typescript
sendMessage('<script>alert("xss")</script>'); // Should be sanitized
sendMessage('Hello 👋 World 🌍'); // Emoji should work
sendMessage('Line 1\nLine 2'); // Newlines should work
```

### 7. Concurrent Users

Open 10+ tabs and verify:
- All receive messages
- No performance degradation
- No memory leaks

---

## Performance Optimization

### 1. Optimize Message Rendering

**File**: `client/src/components/MessageList/MessageList.tsx`

Use React.memo to prevent unnecessary re-renders:

```typescript
import { memo } from 'react';

export const MessageList = memo(function MessageList({ messages, currentUserId, isLoading }) {
  // ... existing code
});
```

### 2. Virtualize Long Message Lists

For channels with 1000+ messages, use virtualization:

```bash
npm install react-window
```

```typescript
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={600}
  itemCount={messages.length}
  itemSize={80}
>
  {({ index, style }) => (
    <div style={style}>
      <Message message={messages[index]} />
    </div>
  )}
</FixedSizeList>
```

### 3. Debounce Auto-Scroll

Prevent excessive scrolling:

```typescript
const debouncedScroll = useMemo(
  () => debounce(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, 100),
  []
);

useEffect(() => {
  debouncedScroll();
}, [messages]);
```

### 4. Limit Message History

Only keep recent messages in state:

```typescript
useEffect(() => {
  if (messages.length > 500) {
    setMessages((prev) => prev.slice(-500)); // Keep last 500
  }
}, [messages]);
```

---

## Polish Items

### 1. Add Typing Indicator Placeholder

```typescript
// Future enhancement - not implemented yet
<div className="px-4 py-2 text-sm text-muted-foreground italic">
  {typingUsers.length > 0 && (
    <span>{typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...</span>
  )}
</div>
```

### 2. Improve Connection Status UI

```typescript
const statusConfig = {
  connecting: {
    icon: Wifi,
    text: 'Connecting...',
    color: 'text-yellow-500',
    animate: 'animate-pulse',
  },
  connected: {
    icon: Wifi,
    text: 'Connected',
    color: 'text-green-500',
    animate: '',
  },
  disconnected: {
    icon: WifiOff,
    text: 'Reconnecting...',
    color: 'text-red-500',
    animate: 'animate-pulse',
  },
  error: {
    icon: AlertCircle,
    text: 'Connection Error',
    color: 'text-red-500',
    animate: '',
  },
};

const config = statusConfig[status];
const Icon = config.icon;

<Icon className={`w-4 h-4 ${config.color} ${config.animate}`} title={config.text} />
```

### 3. Add Message Delivery Indicator

Show when message is sent vs received:

```typescript
interface Message {
  id: number;
  content: string;
  status?: 'sending' | 'sent' | 'delivered';
}

// In Message component
{message.status === 'sending' && <Loader2 className="w-3 h-3 animate-spin" />}
{message.status === 'sent' && <Check className="w-3 h-3" />}
{message.status === 'delivered' && <CheckCheck className="w-3 h-3" />}
```

### 4. Add Sound Notification (Optional)

```typescript
const playMessageSound = () => {
  const audio = new Audio('/message-notification.mp3');
  audio.volume = 0.3;
  audio.play().catch(() => {}); // Ignore errors
};

trpc.message.subscribe.useSubscription(
  { channelId },
  {
    onData: (newMessage) => {
      if (newMessage.userId !== currentUserId) {
        playMessageSound();
      }
      // ... rest
    },
  }
);
```

### 5. Improve Empty State

```typescript
<div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8">
  <MessageCircle className="w-16 h-16 mb-4 opacity-50" />
  <h3 className="text-lg font-semibold mb-2">No messages yet</h3>
  <p className="text-sm text-center max-w-xs">
    Start the conversation! Your messages will appear here in real-time.
  </p>
</div>
```

---

## Monitoring & Debugging

### Add WebSocket Metrics

```typescript
// Track WebSocket stats
const [wsStats, setWsStats] = useState({
  messagesReceived: 0,
  messagesSent: 0,
  reconnections: 0,
  lastMessageTime: null,
});

// Update on events
trpc.message.subscribe.useSubscription(
  { channelId },
  {
    onData: () => {
      setWsStats((prev) => ({
        ...prev,
        messagesReceived: prev.messagesReceived + 1,
        lastMessageTime: new Date(),
      }));
    },
  }
);
```

### Console Logging for Debug

Add debug mode:

```typescript
const DEBUG = import.meta.env.VITE_DEBUG === 'true';

if (DEBUG) {
  console.log('[WS] Connection state:', status);
  console.log('[WS] Message received:', message);
}
```

### Error Tracking

Integrate with error tracking (e.g., Sentry):

```typescript
import * as Sentry from '@sentry/react';

trpc.message.subscribe.useSubscription(
  { channelId },
  {
    onError: (error) => {
      Sentry.captureException(error, {
        tags: { feature: 'websocket', channelId },
      });
    },
  }
);
```

---

## Security Checklist

- [ ] WebSocket authentication works
- [ ] Token is validated on connection
- [ ] Rate limiting prevents spam
- [ ] XSS protection (HTML sanitization)
- [ ] SQL injection prevented (parameterized queries)
- [ ] User can only subscribe to allowed channels
- [ ] No sensitive data in error messages
- [ ] CORS configured correctly

---

## Documentation Updates

Update README with:

```markdown
## WebSocket Configuration

The application uses WebSockets for real-time messaging.

**Development:**
- WebSocket server runs on port 3001
- Client connects to `ws://localhost:3001`

**Production:**
- WebSocket server runs on same host
- Client connects to `wss://ws.yourdomain.com`

**Environment Variables:**

Backend (.env):
```
WS_PORT=3001
WS_ENABLED=true
```

Frontend (client/.env):
```
VITE_WS_URL=ws://localhost:3001
VITE_API_URL=http://localhost:3000/trpc
```

**Troubleshooting:**

If WebSocket connection fails:
1. Check firewall allows port 3001
2. Verify WebSocket server is running
3. Check browser console for errors
4. Application will fall back to HTTP polling
```

---

## Final Acceptance Criteria

### Critical (Must Pass)
- [ ] Messages delivered in < 100ms
- [ ] No duplicate messages
- [ ] Reconnection works automatically
- [ ] Multiple users can chat simultaneously
- [ ] No console errors
- [ ] Authentication works
- [ ] Rate limiting works
- [ ] XSS protection works

### Important (Should Pass)
- [ ] Connection status visible
- [ ] Typing indicators work (if implemented)
- [ ] Sound notifications work (if enabled)
- [ ] Mobile browsers work
- [ ] Network interruptions handled
- [ ] Server restarts handled

### Nice to Have
- [ ] Message delivery confirmations
- [ ] Read receipts
- [ ] User presence
- [ ] Performance metrics

---

## Deployment Checklist

Before production deployment:

- [ ] Update WebSocket URL for production
- [ ] Configure SSL/TLS for WSS (wss://)
- [ ] Set up load balancer for WebSocket
- [ ] Configure sticky sessions (if needed)
- [ ] Enable WebSocket monitoring
- [ ] Set up alerts for connection issues
- [ ] Document rollback procedure
- [ ] Test with staging environment
- [ ] Verify firewall rules
- [ ] Check CORS configuration

---

## Known Limitations

Document current limitations:

1. **Single Server** - EventEmitter doesn't work across multiple servers
   - Solution: Add Redis pub/sub (future enhancement)

2. **Connection Limit** - WebSocket connections consume memory
   - Current: ~1000 concurrent connections per server
   - Solution: Scale horizontally with Redis

3. **No Message Persistence** - Messages only in database, not in WebSocket
   - Reconnecting clients fetch history via HTTP
   - Not a real limitation, by design

4. **No Typing Indicators Yet** - Not implemented in this phase
   - Easy to add later

---

## Files Modified

- [x] `client/src/components/MessageList/MessageList.tsx` - Performance optimizations
- [x] `client/src/components/ChatPanel/ChatPanel.tsx` - Polish improvements
- [ ] `README.md` - Documentation updates

## Files Created (Optional)

- [ ] `docs/websocket-guide.md` - WebSocket setup guide
- [ ] `client/public/message-notification.mp3` - Sound effect

---

## Next Steps

After Phase 4 is complete:
- ✅ Feature 005 is production-ready
- ✅ Real-time messaging fully functional
- → Optional: Feature 006 (Redis scaling)
- → Optional: Add typing indicators, presence

---

## Status

**Current Status**: ⏳ To Do  
**Last Updated**: 2025-12-31

---

## Sign-Off

- [ ] Developer tested
- [ ] Code reviewed
- [ ] QA tested
- [ ] Product owner approved
- [ ] Documentation updated
- [ ] Ready for deployment
