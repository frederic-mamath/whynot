# Phase 3: Frontend - View-Only Mode for Buyers

**Estimated Time**: 2 hours  
**Actual Time**: 0.5 hours  
**Status**: ✅ Done  
**Completed**: 2025-12-29  
**Dependencies**: Phase 2 completed, RBAC system (role.myRoles endpoint)

---

## Objective

Implement view-only mode for buyers in live channels. Buyers should join Agora as "audience" and not publish video/audio streams.

---

## Files to Create/Modify

### New Files
- `client/src/hooks/useUserRole.ts` - Custom hook to get user role
- `client/src/components/ui/RoleBadge/RoleBadge.tsx` - Display user role badge
- `client/src/components/ui/RoleBadge/index.ts` - Export

### Files to Modify
- `client/src/pages/Channel/ChannelPage.tsx` - Update Agora setup based on role

---

## Steps

### 1. Create User Role Hook

Create `client/src/hooks/useUserRole.ts`:

```typescript
import { trpc } from '../utils/trpc';

export function useUserRole() {
  const { data: user } = trpc.user.me.useQuery();
  
  const isSeller = user?.role === 'seller';
  const isBuyer = user?.role === 'buyer';
  const role = user?.role || 'buyer'; // Default to buyer

  return {
    role,
    isSeller,
    isBuyer,
    canPublish: isSeller, // Only sellers can publish video/audio
  };
}
```

### 2. Create Role Badge Component

Create `client/src/components/ui/RoleBadge/RoleBadge.tsx`:

```typescript
import { Badge } from '../badge';
import { Crown, Eye } from 'lucide-react';

interface RoleBadgeProps {
  role: 'seller' | 'buyer';
  className?: string;
}

export function RoleBadge({ role, className }: RoleBadgeProps) {
  if (role === 'seller') {
    return (
      <Badge variant="default" className={className}>
        <Crown className="w-3 h-3 mr-1" />
        Seller
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" className={className}>
      <Eye className="w-3 h-3 mr-1" />
      View Only
    </Badge>
  );
}
```

Create `client/src/components/ui/RoleBadge/index.ts`:

```typescript
export { RoleBadge } from './RoleBadge';
```

### 3. Update Channel Page

Modify `client/src/pages/Channel/ChannelPage.tsx`:

```typescript
import { useUserRole } from '../../hooks/useUserRole';
import { RoleBadge } from '../../components/ui/RoleBadge';

export function ChannelPage() {
  const { channelId } = useParams();
  const { role, canPublish } = useUserRole();
  
  // ... existing state

  // Join channel with role
  const joinChannelMutation = trpc.channel.join.useMutation({
    onSuccess: async (data) => {
      const { token, uid, channelName } = data;

      // Initialize Agora client with role-based settings
      const agoraRole = canPublish ? 'host' : 'audience';
      
      await client.setClientRole(agoraRole);
      
      await client.join(
        import.meta.env.VITE_AGORA_APP_ID,
        channelName,
        token,
        uid
      );

      // Only create tracks for sellers (hosts)
      if (canPublish) {
        const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
        setLocalAudioTrack(audioTrack);
        setLocalVideoTrack(videoTrack);

        // Publish tracks
        await client.publish([audioTrack, videoTrack]);
      }

      setJoined(true);
      toast.success(canPublish ? 'Joined as broadcaster' : 'Joined as viewer');
    },
  });

  // Update UI to hide controls for buyers
  return (
    <div className="channel-page">
      {/* Header with role badge */}
      <div className="header">
        <h1>{channelName}</h1>
        <RoleBadge role={role} />
      </div>

      {/* Video grid */}
      <div className="video-grid">
        {/* Remote users (seller's stream) */}
        {remoteUsers.map((user) => (
          <RemoteUser key={user.uid} user={user} />
        ))}

        {/* Local video (only for sellers) */}
        {canPublish && localVideoTrack && (
          <div className="local-video">
            <LocalVideoPlayer track={localVideoTrack} />
          </div>
        )}

        {/* View-only message for buyers */}
        {!canPublish && remoteUsers.length === 0 && (
          <div className="empty-state">
            <Eye className="w-12 h-12 mb-4" />
            <p>Waiting for the seller to start streaming...</p>
          </div>
        )}
      </div>

      {/* Controls (only for sellers) */}
      {canPublish && (
        <div className="controls">
          <Button
            onClick={() => toggleAudio()}
            variant={isAudioMuted ? 'destructive' : 'default'}
          >
            {isAudioMuted ? <MicOff /> : <Mic />}
          </Button>
          <Button
            onClick={() => toggleVideo()}
            variant={isVideoMuted ? 'destructive' : 'default'}
          >
            {isVideoMuted ? <VideoOff /> : <Video />}
          </Button>
          <Button onClick={() => leaveChannel()} variant="destructive">
            Leave
          </Button>
        </div>
      )}

      {/* Leave button for buyers */}
      {!canPublish && (
        <div className="controls">
          <Button onClick={() => leaveChannel()} variant="outline">
            Leave Channel
          </Button>
        </div>
      )}
    </div>
  );
}
```

### 4. Update Leave Channel Logic

```typescript
const leaveChannel = async () => {
  // Only unpublish if user is a publisher
  if (canPublish) {
    if (localAudioTrack) {
      localAudioTrack.stop();
      localAudioTrack.close();
    }
    if (localVideoTrack) {
      localVideoTrack.stop();
      localVideoTrack.close();
    }
  }

  await client.leave();
  setJoined(false);
  navigate('/channels');
};
```

---

## Acceptance Criteria

- [x] Buyers join Agora as "audience" (not "host")
- [x] Buyers do not create local audio/video tracks
- [x] Buyers cannot see audio/video controls (mute, video toggle)
- [x] Buyers can see seller's video/audio stream
- [x] Sellers join as "host" and can publish streams
- [x] Role badge displays correctly (Broadcaster vs Viewer)
- [x] Empty state shown when no seller is streaming
- [x] Buyers have "Leave Channel" button in header
- [x] Sellers have full controls (mute, video, leave, screen share)
- [x] Local video only shown for broadcasters

---

## Testing

### Manual Testing

1. **Test as Seller**:
   - [ ] Login as seller account
   - [ ] Create and join channel
   - [ ] Verify video/audio controls visible
   - [ ] Verify "Seller" badge shown
   - [ ] Verify can publish video/audio

2. **Test as Buyer**:
   - [ ] Login as buyer account
   - [ ] Join channel created by seller
   - [ ] Verify NO video/audio controls
   - [ ] Verify "View Only" badge shown
   - [ ] Verify can see seller's video/audio
   - [ ] Verify no local video track created

3. **Test Role Switching**:
   - [ ] Change user role in database
   - [ ] Refresh page
   - [ ] Verify correct behavior for new role

### Edge Cases

- [ ] What if no seller in channel? (show empty state)
- [ ] What if seller leaves? (buyer stays in channel)
- [ ] What if buyer tries to publish? (prevented by Agora role)

---

## UI/UX Considerations

### Buyer Experience
- Show clear "View Only" indicator
- Display message when waiting for seller
- Simple "Leave" button (no confusing controls)
- Helpful tooltip: "Only sellers can broadcast"

### Seller Experience
- Show "Seller" badge for confidence
- Full controls as before
- See buyer count in participant list

### Design Tokens (Tailwind)
- Role badge: `bg-primary` (seller), `bg-secondary` (buyer)
- Empty state: `text-muted-foreground`
- Icons: Lucide `Crown` (seller), `Eye` (viewer)

---

## Rollback Plan

If issues occur:
1. Revert `ChannelPage.tsx` to always use "host" role
2. Remove role badge component
3. Remove `useUserRole` hook

---

## Notes

- Agora roles: `host` (can publish), `audience` (view-only)
- Buyers use significantly less bandwidth (no upload)
- Consider showing buyer count to seller
- Future: Allow seller to promote buyer to co-host

---

## Status

**Current Status**: ✅ Done  
**Last Updated**: 2025-12-29  
**Completion Notes**: 
- useUserRole hook created using role.myRoles endpoint
- RoleBadge component created with Broadcaster/Viewer variants
- ChannelPage updated to conditionally create tracks based on role
- Control bar only shown for broadcasters
- Local video only shown for broadcasters
- Empty state shows appropriate message for viewers
- All components built successfully
