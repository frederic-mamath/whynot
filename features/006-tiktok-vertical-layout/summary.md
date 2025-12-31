# Feature 006: TikTok-Style Vertical Layout

**Feature ID**: 006  
**Feature Name**: TikTok-Style Vertical Layout  
**Status**: 🚧 In Progress (Phase 2 Complete)  
**Priority**: High  
**Estimated Effort**: 4-6 hours  
**Dependencies**: Feature 001 (Live Streaming), Feature 004 (Messaging UI)

---

## Overview

Transform the ChannelPage from a traditional horizontal video conferencing layout to a modern TikTok-style vertical layout optimized for mobile streaming. The video broadcast fills a vertical rectangle (9:16 aspect ratio), with controls and chat positioned as overlays.

---

## User Stories

### Story 1: Vertical Video Display
**As** an authenticated user  
**When** I access a channel  
**Then** I see the broadcast in a vertical rectangle (TikTok-style 9:16 format)

### Story 2: Host Control Panel
**As** a channel host (seller)  
**When** I'm in a channel  
**Then** I see a vertical list of control buttons (video/mic toggle, participants)  
**And** they are positioned absolutely at the bottom-right of the video rectangle

### Story 3: Chat Input Positioning
**As** an authenticated user  
**When** I'm in a channel  
**Then** I see the message input at the bottom of the video rectangle  
**And** it takes all available width after accounting for the control buttons  
**And** it's positioned above the controls

---

## Current State

### Current Layout (Desktop-First)
```
┌─────────────────────────────────────────────┐
│ Header (Leave button, role, network)       │
├───────────────────────────┬─────────────────┤
│                           │                 │
│  Video Grid (Horizontal)  │   Chat Panel    │
│  - Remote users           │   (Sidebar)     │
│  - Multiple tiles         │                 │
│                           │                 │
│                           │                 │
│                           │                 │
├───────────────────────────┴─────────────────┤
│ [Control Bar - Centered Bottom]            │
│ [Mic] [Video] [Screen] | [Users] | [Leave] │
└─────────────────────────────────────────────┘
```

### Issues with Current Layout
- ❌ Horizontal video grid (not mobile-first)
- ❌ Traditional video conferencing layout
- ❌ Chat panel in sidebar (not optimized for mobile)
- ❌ Controls in center bottom (takes too much space)
- ❌ Not optimized for single-broadcaster scenarios
- ❌ Doesn't match TikTok/Instagram Live UX

---

## Target Layout (TikTok-Style)

### Mobile-First Vertical Layout
```
┌─────────────────────┐
│                     │
│                     │
│    Vertical Video   │
│    (9:16 aspect)    │
│   [Broadcaster]     │
│                     │
│                     │
│                     │
│                     │
│                     │
│                     │
├─────────────────────┤
│ [Message Input────] │ ← Full width minus controls
│ [📤] [👁️ 42] [Mic]  │ ← Vertical stack (host only)
│      [Video]        │
│      [Users]        │
└─────────────────────┘
```

### Layout Breakdown

**For Viewers (Buyers):**
```
┌─────────────────────┐
│                     │
│   Broadcaster       │
│   Video Feed        │
│   (9:16)            │
│                     │
│                     │
│                     │
├─────────────────────┤
│ [Message Input────] │ ← Bottom overlay
│ [Send 📤]          │
│ [👁️ 42 viewers]    │
└─────────────────────┘
```

**For Host (Seller):**
```
┌─────────────────────┐
│                     │
│   Broadcaster       │
│   Video Feed        │
│   (9:16)            │
│                     │
│                     │
│              [Mic]  │ ← Vertical stack
│              [Cam]  │   (bottom-right)
│              [👤]   │
├─────────────────────┤
│ [Message Input────] │ ← Bottom left
└─────────────────────┘
```

---

## Technical Approach

### Phase 1: Vertical Container & Aspect Ratio (1-1.5h)

**Objective**: Restructure ChannelPage to use vertical 9:16 container

**Changes:**
1. Update main container to use vertical layout
2. Apply 9:16 aspect ratio (TikTok standard)
3. Center video container on screen
4. Use `aspect-[9/16]` or `aspect-[1080/1920]`
5. Make it responsive (full height on mobile, centered on desktop)

**Files to Update:**
- `client/src/pages/ChannelPage.tsx` - Main layout restructure

**Acceptance Criteria:**
- [ ] Video container is vertical (9:16 aspect ratio)
- [ ] Container is centered on desktop
- [ ] Container is full-screen on mobile
- [ ] Video fills container maintaining aspect ratio
- [ ] No horizontal scrolling

---

### Phase 2: Control Panel Positioning (1-1.5h)

**Objective**: Create vertical control stack positioned at bottom-right (host only)

**Changes:**
1. Create new component: `VerticalControlPanel.tsx`
2. Stack buttons vertically (Mic, Video, Users)
3. Position absolute: `bottom-20 right-4`
4. Only visible for host (canPublish === true)
5. Use icon-only buttons for compact layout
6. Add viewer count badge

**New Components:**
```
client/src/components/VerticalControlPanel/
├── VerticalControlPanel.tsx
└── index.ts
```

**Acceptance Criteria:**
- [ ] Control buttons stacked vertically
- [ ] Positioned at bottom-right
- [ ] Only visible to host
- [ ] Mic, Video, Users buttons functional
- [ ] Viewer count displayed
- [ ] Buttons are icon-only (compact)

---

### Phase 3: Message Input Repositioning (1.5-2h)

**Objective**: Move message input to bottom of video, accounting for controls

**Changes:**
1. Extract MessageInput from ChatPanel
2. Position absolute: `bottom-4 left-4`
3. Calculate width: `calc(100% - controls_width - padding)`
4. Make it semi-transparent overlay
5. Auto-hide when not focused (optional)
6. Show message count/indicator

**Component Updates:**
- `client/src/components/ChatPanel/ChatPanel.tsx` - Extract input
- `client/src/components/MessageInput/MessageInput.tsx` - New component

**CSS Strategy:**
```css
.message-input {
  position: absolute;
  bottom: 1rem; /* 16px */
  left: 1rem;
  right: 5rem; /* Space for controls */
  max-width: calc(100% - 6rem);
}

/* For hosts with controls */
.message-input--with-controls {
  right: 7rem; /* More space for vertical controls */
}
```

**Acceptance Criteria:**
- [ ] Message input at bottom of video
- [ ] Doesn't overlap with controls
- [ ] Responsive width calculation
- [ ] Visible to all users
- [ ] Semi-transparent background
- [ ] Functional (send messages)

---

### Phase 4: Chat Messages Display (1-1.5h)

**Objective**: Display chat messages as overlay (Instagram Live style)

**Changes:**
1. Create `ChatOverlay.tsx` component
2. Position messages above input (scrolling up)
3. Semi-transparent background
4. Auto-hide old messages (fade out)
5. Limit to last 3-5 messages visible
6. Smooth scroll/animation

**New Components:**
```
client/src/components/ChatOverlay/
├── ChatOverlay.tsx
└── index.ts
```

**Design:**
```
┌─────────────────────┐
│                     │
│   Video             │
│                     │
│   User1: Hi! 👋     │ ← Semi-transparent
│   User2: Cool!      │   overlay messages
│                     │
├─────────────────────┤
│ [Message Input────] │
└─────────────────────┘
```

**Acceptance Criteria:**
- [ ] Messages overlay video
- [ ] Semi-transparent background
- [ ] Show last 3-5 messages
- [ ] Auto-scroll with new messages
- [ ] Fade out animation
- [ ] Doesn't block video

---

### Phase 5: Responsive & Polish (0.5-1h)

**Objective**: Ensure layout works on all screen sizes

**Changes:**
1. Mobile: Full-screen vertical video
2. Tablet: Centered with max-width
3. Desktop: Centered, max 600px width
4. Handle landscape orientation
5. Test on different devices
6. Add transitions/animations

**Responsive Breakpoints:**
```css
/* Mobile (default) */
.video-container {
  width: 100vw;
  height: 100vh;
}

/* Tablet */
@media (min-width: 768px) {
  .video-container {
    max-width: 480px;
    margin: 0 auto;
  }
}

/* Desktop */
@media (min-width: 1024px) {
  .video-container {
    max-width: 600px;
  }
}
```

**Acceptance Criteria:**
- [ ] Works on mobile (320px - 480px)
- [ ] Works on tablet (768px - 1024px)
- [ ] Works on desktop (1024px+)
- [ ] Handles orientation changes
- [ ] Smooth transitions
- [ ] No layout shifts

---

## Design Specifications

### Aspect Ratio
- **Video**: 9:16 (1080x1920, TikTok standard)
- **Alternative**: 2:3 (720x1080, Instagram Reels)
- **Recommendation**: Use `aspect-[9/16]` for TikTok style

### Control Panel (Host Only)
- **Position**: Absolute, bottom-right
- **Buttons**: 
  - Mic (toggle audio)
  - Video (toggle camera)
  - Users (show participants)
- **Spacing**: `gap-3` (12px between buttons)
- **Size**: Icon-only, `size="icon"` (40x40px)

### Message Input
- **Position**: Absolute, bottom
- **Width**: Full width minus controls (dynamic)
- **For viewers**: `left-4 right-4`
- **For hosts**: `left-4 right-[80px]` (space for controls)
- **Background**: `bg-background/80 backdrop-blur-sm`

### Chat Overlay
- **Position**: Above message input
- **Max messages**: 5 visible
- **Message styling**: 
  - `bg-background/60`
  - `backdrop-blur-sm`
  - `rounded-lg`
  - `p-2`
- **Animation**: Fade in/out, slide up

---

## Files to Create

```
client/src/components/VerticalControlPanel/
├── VerticalControlPanel.tsx
└── index.ts

client/src/components/ChatOverlay/
├── ChatOverlay.tsx
└── index.ts

client/src/components/MessageInput/
├── MessageInput.tsx
└── index.ts
```

---

## Files to Modify

```
client/src/pages/ChannelPage.tsx
client/src/components/ChatPanel/ChatPanel.tsx
```

---

## Success Criteria

### Must Have
- [x] Vertical video container (9:16 aspect ratio)
- [x] Video fills container
- [x] Host controls in vertical stack (bottom-right)
- [x] Message input at bottom (full width minus controls)
- [x] Responsive (mobile-first)
- [x] Works for both host and viewers
- [x] No breaking changes to functionality

### Nice to Have
- [ ] Chat messages overlay (Instagram Live style)
- [ ] Auto-hide controls after inactivity
- [ ] Smooth transitions/animations
- [ ] Viewer count animation
- [ ] Message input auto-expand
- [ ] Emoji support in overlay

---

## Timeline

| Phase | Duration | Status | Start | End |
|-------|----------|--------|-------|-----|
| Phase 1: Vertical Container | 1-1.5h | ✅ Done | 2025-12-31 | 2025-12-31 |
| Phase 2: Control Panel | 1-1.5h | ✅ Done | 2025-12-31 | 2025-12-31 |
| Phase 3: Message Input | 1.5-2h | ⏳ To Do | - | - |
| Phase 4: Chat Overlay | 1-1.5h | ⏳ To Do | - | - |
| Phase 5: Responsive & Polish | 0.5-1h | ⏳ To Do | - | - |
| **Total** | **4-6h** | - | - | - |

---

## Risks & Mitigations

### Risk 1: Aspect Ratio Distortion
**Problem**: Video might be stretched/cropped  
**Mitigation**: Use `object-fit: cover` or `object-fit: contain`

### Risk 2: Control Overlap
**Problem**: Controls might overlap with message input  
**Mitigation**: Calculate dynamic widths with CSS `calc()`

### Risk 3: Mobile Keyboard
**Problem**: Keyboard might push layout up  
**Mitigation**: Use `vh` units carefully, test on real devices

### Risk 4: Performance
**Problem**: Overlay animations might be laggy  
**Mitigation**: Use CSS transforms, GPU acceleration

---

## Testing Checklist

- [ ] Test on iPhone (Safari)
- [ ] Test on Android (Chrome)
- [ ] Test on iPad
- [ ] Test on desktop (Chrome, Firefox, Safari)
- [ ] Test as host (seller)
- [ ] Test as viewer (buyer)
- [ ] Test portrait orientation
- [ ] Test landscape orientation
- [ ] Test with/without keyboard
- [ ] Test message sending
- [ ] Test control buttons (host)
- [ ] Test participant list
- [ ] Test with long messages
- [ ] Test with many viewers

---

## Future Enhancements

- [ ] Swipe gestures (like TikTok)
- [ ] Double-tap to like
- [ ] Gift/reaction animations
- [ ] Product pinning overlay
- [ ] Live shopping cart overlay
- [ ] Full-screen mode toggle
- [ ] Picture-in-picture support
- [ ] Auto-rotate detection

---

## Documentation

**Created**: 2025-12-31  
**Last Updated**: 2025-12-31  
**Status**: Planning Phase  
**Next Step**: Begin Phase 1 - Vertical Container & Aspect Ratio
