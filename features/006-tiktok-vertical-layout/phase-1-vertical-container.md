# Phase 1: Vertical Container & Aspect Ratio

**Estimated Time**: 1-1.5 hours  
**Status**: ⏳ To Do  
**Dependencies**: None

---

## Objective

Restructure the ChannelPage layout from a horizontal video conferencing grid to a single vertical video container with TikTok-style 9:16 aspect ratio.

---

## Current State

The current ChannelPage uses:
- Horizontal video grid layout
- Multiple video tiles for remote users
- Desktop-first responsive design
- Chat panel in sidebar (desktop) or bottom (mobile)

---

## Target State

Transform to:
- Single vertical video container (9:16 aspect ratio)
- Centered on desktop, full-screen on mobile
- Video fills container maintaining aspect ratio
- Foundation for overlays (controls, chat)

---

## Tasks

### 1. Update Main Container Structure

**File**: `client/src/pages/ChannelPage.tsx`

**Current Structure:**
```tsx
<div className="min-h-screen bg-background flex flex-col lg:flex-row">
  <div className="flex-1 flex flex-col">
    {/* Header */}
    {/* Video Grid */}
    {/* Controls */}
  </div>
  <div className="w-full lg:w-80 xl:w-96">
    {/* Chat Panel */}
  </div>
</div>
```

**New Structure:**
```tsx
<div className="min-h-screen bg-background flex items-center justify-center">
  <div className="relative w-full max-w-[600px] h-screen lg:h-[90vh]">
    {/* Vertical Video Container */}
    <div className="absolute inset-0 aspect-[9/16] mx-auto bg-card rounded-none lg:rounded-lg overflow-hidden">
      {/* Video Player */}
      {/* Overlays will go here in next phases */}
    </div>
  </div>
</div>
```

---

### 2. Update Video Player Container

**Changes:**
- Remove grid layout
- Use single video element
- Apply aspect ratio constraints
- Ensure video fills container

**Code:**
```tsx
{/* Main Video Container */}
<div className="relative w-full h-full bg-black">
  {/* Remote User Video (Primary - The Broadcaster) */}
  {Array.from(remoteUsers.entries()).length > 0 ? (
    <div className="w-full h-full">
      {Array.from(remoteUsers.entries()).map(([uid, user], index) => {
        // Only show first remote user (broadcaster) in main view
        if (index === 0) {
          return (
            <div key={uid} className="w-full h-full relative">
              <div
                id={`remote-player-${uid}`}
                className="w-full h-full [&>div]:!h-full [&_video]:!object-cover"
              />
              
              {/* Broadcaster Info Overlay (Top) */}
              <div className="absolute top-4 left-4 flex items-center gap-2">
                <div className="size-10 rounded-full bg-primary flex items-center justify-center">
                  <span className="text-sm font-bold text-primary-foreground">
                    {uid.toString().slice(0, 2)}
                  </span>
                </div>
                <div className="bg-background/80 backdrop-blur-sm px-3 py-1 rounded-full">
                  <span className="text-sm font-medium">User {uid}</span>
                </div>
              </div>
            </div>
          );
        }
        return null;
      })}
    </div>
  ) : (
    // Placeholder when no broadcaster
    <div className="w-full h-full flex items-center justify-center">
      <div className="text-center space-y-4">
        {canPublish ? (
          <>
            <UsersIcon className="size-16 mx-auto text-muted-foreground" />
            <h3 className="text-lg font-semibold">Waiting for participants</h3>
            <p className="text-sm text-muted-foreground">
              Invite others to join this channel
            </p>
          </>
        ) : (
          <>
            <Eye className="size-16 mx-auto text-muted-foreground" />
            <h3 className="text-lg font-semibold">Waiting for broadcaster</h3>
            <p className="text-sm text-muted-foreground">
              The stream will appear when the broadcaster starts
            </p>
          </>
        )}
      </div>
    </div>
  )}
</div>
```

---

### 3. Remove/Hide Old Header

The traditional header can be removed or simplified:

**Option 1: Remove completely**
```tsx
// Remove the header section entirely
```

**Option 2: Keep minimal info (recommended)**
```tsx
{/* Minimal Header - Position absolute top */}
<div className="absolute top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-black/60 to-transparent">
  <div className="flex items-center justify-between">
    <Button
      variant="ghost"
      size="icon"
      onClick={handleLeave}
      className="text-white hover:bg-white/20"
    >
      <ArrowLeft className="size-5" />
    </Button>
    
    <div className="flex items-center gap-2">
      <RoleBadge role={role} />
      <NetworkQuality client={client} />
    </div>
  </div>
</div>
```

---

### 4. Update Local Video (Picture-in-Picture)

For hosts, show local video as small overlay:

**Position**: Top-right corner instead of bottom-right

```tsx
{/* Local Video (Picture-in-Picture) - Only for Broadcasters */}
{canPublish && localVideoTrack && (
  <div className="absolute top-20 right-4 w-24 h-32 z-20">
    <div className="relative bg-card rounded-lg overflow-hidden border-2 border-primary shadow-lg">
      <div id="local-player" className="w-full h-full [&_video]:!object-cover" />
      <div className="absolute bottom-1 left-1 px-2 py-0.5 bg-background/80 backdrop-blur-sm rounded text-xs font-medium">
        You
      </div>
    </div>
  </div>
)}
```

---

### 5. Responsive Styling

**Tailwind Classes:**
```tsx
// Container
className="relative w-full max-w-[600px] h-screen lg:h-[90vh]"

// Video aspect ratio container
className="absolute inset-0 aspect-[9/16] mx-auto bg-card rounded-none lg:rounded-lg overflow-hidden"

// Full-screen mobile, centered desktop
<div className="min-h-screen bg-background flex items-center justify-center p-0 lg:p-4">
```

---

### 6. CSS Adjustments

**Force video to fill container:**
```tsx
// Add custom CSS for Agora video elements
<style>{`
  .agora-video-player {
    width: 100% !important;
    height: 100% !important;
  }
  
  .agora-video-player video {
    object-fit: cover !important;
    width: 100% !important;
    height: 100% !important;
  }
`}</style>
```

---

## Code Changes Summary

### Before (Lines ~525-705)
```tsx
return (
  <div className="min-h-screen bg-background flex flex-col lg:flex-row">
    <div className="flex-1 flex flex-col min-h-0">
      {/* Header */}
      <div className="border-b border-border bg-card">...</div>
      
      {/* Video Grid */}
      <div className="flex-1 p-2 sm:p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
          {/* Multiple video tiles */}
        </div>
      </div>
      
      {/* Control Bar */}
      <div className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2">
        {/* Controls */}
      </div>
    </div>
    
    {/* Chat Panel Sidebar */}
    <div className="w-full lg:w-80 xl:w-96">
      <ChatPanel />
    </div>
  </div>
);
```

### After
```tsx
return (
  <div className="min-h-screen bg-background flex items-center justify-center p-0 lg:p-4">
    {/* Main Vertical Container */}
    <div className="relative w-full max-w-[600px] h-screen lg:h-[90vh]">
      {/* Aspect Ratio Container */}
      <div className="absolute inset-0 aspect-[9/16] mx-auto bg-black rounded-none lg:rounded-lg overflow-hidden">
        
        {/* Minimal Header Overlay */}
        <div className="absolute top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-black/60 to-transparent">
          {/* Back button, role badge, network quality */}
        </div>
        
        {/* Main Video */}
        <div className="relative w-full h-full">
          {/* Broadcaster video */}
        </div>
        
        {/* Local Video PiP (Host Only) */}
        {canPublish && localVideoTrack && (
          <div className="absolute top-20 right-4 w-24 h-32 z-20">
            {/* Local video preview */}
          </div>
        )}
        
        {/* Controls and Chat overlays will be added in next phases */}
      </div>
    </div>
  </div>
);
```

---

## Testing Steps

### 1. Visual Check
- [ ] Video container is vertical
- [ ] 9:16 aspect ratio maintained
- [ ] Centered on desktop
- [ ] Full-screen on mobile
- [ ] No horizontal scrolling

### 2. Responsive Testing
```bash
# Test different viewport sizes
# Mobile: 375x667 (iPhone SE)
# Tablet: 768x1024 (iPad)
# Desktop: 1920x1080
```

### 3. Browser Testing
- [ ] Chrome (desktop & mobile)
- [ ] Safari (iOS)
- [ ] Firefox
- [ ] Edge

### 4. Functionality Check
- [ ] Video plays in container
- [ ] Aspect ratio maintained
- [ ] No distortion/stretching
- [ ] Local video shows (host)
- [ ] Remote video shows (viewer)

---

## Acceptance Criteria

- [ ] Main container uses vertical layout
- [ ] Video aspect ratio is 9:16
- [ ] Container is centered on desktop
- [ ] Container is full-screen on mobile
- [ ] Video fills container without distortion
- [ ] No horizontal scrolling on any device
- [ ] Header is minimal or removed
- [ ] Local video (PiP) repositioned for host
- [ ] Broadcaster video shows in main view
- [ ] Placeholder shown when no broadcaster

---

## Troubleshooting

### Issue: Video is stretched
**Solution**: Add `object-fit: cover` to video element

### Issue: Black bars on sides
**Solution**: Ensure parent container uses `aspect-[9/16]`

### Issue: Container too large on mobile
**Solution**: Use `h-screen` on mobile, `h-[90vh]` on desktop

### Issue: Video doesn't fill height
**Solution**: Add `[&_video]:!h-full` to force Agora video sizing

---

## Files Modified

- [x] `client/src/pages/ChannelPage.tsx` - Main layout restructure

---

## Next Steps

After Phase 1:
- ✅ Vertical container working
- ✅ Video fills 9:16 space
- → Move to **Phase 2**: Control Panel Positioning

---

## Status

**Current Status**: ⏳ To Do  
**Last Updated**: 2025-12-31
