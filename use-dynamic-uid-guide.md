# Alternative: Using Dynamic UIDs (UID = 0)

If UID conflicts persist, you can switch to dynamic UIDs where Agora assigns a random UID each time.

## Backend Changes (src/routers/channel.ts)

Change:
```typescript
const token = generateAgoraToken({
  channelName: channel.id.toString(),
  uid: ctx.userId,  // ❌ Fixed UID causes conflicts
  role: 'host',
});
```

To:
```typescript
const token = generateAgoraToken({
  channelName: channel.id.toString(),
  uid: 0,  // ✅ 0 = Dynamic UID
  role: 'host',
});
```

## Client Changes (client/src/pages/Channel/ChannelPage.tsx)

The client will receive UID = 0 and Agora will assign a random UID automatically.

## Pros/Cons

**Fixed UID (current):**
- ✅ You know who is who by UID
- ✅ Can track users across sessions
- ❌ Can cause UID_CONFLICT if not cleaned up properly

**Dynamic UID (UID = 0):**
- ✅ No UID conflicts
- ✅ Simpler to implement
- ❌ Harder to track specific users
- ❌ Need to use displayName/metadata to identify users
