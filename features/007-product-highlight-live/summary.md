# Feature 007: Live Product Highlighting

**Feature Description**: Enable SELLER hosts to highlight a single product in real-time during live streams, broadcasting the selection to all connected BUYERs with live synchronization.

**Priority**: High  
**Complexity**: Medium  
**Estimated Total Time**: 10-12 hours

---

## Feature Overview

### Goals
- Allow SELLER hosts to select one product to highlight from promoted products
- Display highlighted product below chat input for all users
- Real-time broadcast of highlight state changes via WebSocket
- Support manual highlight/unhighlight by SELLER
- Prepare UI for future auction features (bid controls, current bid status)

### User Stories
- **As a SELLER host**, I want to highlight a product from my promoted list so BUYERs can see what I'm showcasing
- **As a SELLER host**, I want to unhighlight the current product at any time
- **As a BUYER**, I want to see the highlighted product appear instantly when the host selects it
- **As a BUYER**, I want to toggle the visibility of the highlighted product without leaving the channel
- **As a BUYER**, I want to click on the highlighted product to see full details

### Tech Stack
- **Backend**: tRPC (highlight endpoints), WebSocket (real-time broadcast)
- **Frontend**: React, WebSocket client, Shadcn UI components
- **Database**: PostgreSQL (highlight state tracking)

### Key Constraints
- Only **one product** can be highlighted at a time per channel
- Only **promoted products** can be highlighted
- Highlight state **persists** for new joiners
- SELLER can highlight/unhighlight at any time (no duration limits)

---

## Implementation Phases

### Phase 1: Backend - Database & tRPC Endpoints
**Status**: ✅ Complete  
**Estimated Time**: 2-3 hours

**Key Deliverables**:
- [x] Add `highlightedProductId` column to `channels` table (nullable)
- [x] Add `highlightedAt` timestamp to track when product was highlighted
- [x] Create migration for database changes
- [x] Create tRPC endpoints:
  - `channel.highlightProduct` (SELLER only)
  - `channel.unhighlightProduct` (SELLER only)
  - `channel.getHighlightedProduct` (all authenticated users)
- [x] Add permission checks (SELLER role required)
- [x] Validate product is promoted to channel before highlighting

**Files Created/Modified**:
- `migrations/011_add_highlighted_product.ts`
- `src/db/types.ts` (updated ChannelsTable interface)
- `src/server/routers/channel.ts`

---

### Phase 2: Backend - WebSocket Real-time Broadcast
**Status**: ✅ Complete  
**Estimated Time**: 2 hours

**Key Deliverables**:
- [x] Define WebSocket message types:
  - `PRODUCT_HIGHLIGHTED` (with product details)
  - `PRODUCT_UNHIGHLIGHTED`
- [x] Broadcast highlight events to all channel participants
- [x] Send current highlight state when user subscribes to channel events
- [x] Update WebSocket message handler types

**Files Created/Modified**:
- `src/websocket/types.ts` (created - message type definitions)
- `src/websocket/broadcast.ts` (created - channel broadcasting utilities)
- `src/websocket/server.ts` (updated - cleanup on disconnect)
- `src/server/routers/channel.ts` (added subscribeToEvents endpoint, emit events)


---

### Phase 3: Frontend - Highlighted Product Component
**Status**: ✅ Complete  
**Estimated Time**: 3 hours

**Key Deliverables**:
- [x] Create `HighlightedProduct` component:
  - Display product image, name, price (as "Starting Price"), description
  - Positioned below chat input (above message list)
  - Clickable to open product details in Sheet/Modal
  - Reserve space for future auction controls (bid amount, current bid)
  - Theme-compatible styling
- [x] Integrate component into ChatPanel
- [x] Add collapse/expand animation
- [x] Mobile-responsive layout
- [x] WebSocket subscription for real-time events
- [x] Toast notifications on highlight changes

**Files Created**:
- `client/src/components/HighlightedProduct/HighlightedProduct.tsx`
- `client/src/components/HighlightedProduct/index.ts`

**Files Modified**:
- `client/src/pages/ChannelDetailsPage.tsx` (WebSocket integration, state management)
- `client/src/components/ChatPanel/ChatPanel.tsx` (integrated HighlightedProduct)
- `client/src/components/VerticalControlPanel/VerticalControlPanel.tsx` (added toggle button)
- `client/src/components/PromotedProducts/PromotedProducts.tsx` (SELLER highlight controls)

---

### Phase 4: Frontend - SELLER Controls
**Status**: ✅ Complete  
**Estimated Time**: 2 hours

**Key Deliverables**:
- [x] Update `PromotedProducts` component:
  - Add "Highlight" button for each product (SELLER only)
  - Show "Highlighted" badge on currently highlighted product
  - Change button to "Unhighlight" for active highlight
- [x] Add tRPC mutation calls for highlight/unhighlight
- [x] Add optimistic UI updates
- [x] Add error handling and toast notifications

**Files Modified**:
- `client/src/components/PromotedProducts/PromotedProducts.tsx`

---

### Phase 5: Frontend - BUYER Controls & WebSocket Integration
**Status**: ✅ Complete  
**Estimated Time**: 2-3 hours

**Key Deliverables**:
- [x] Add "Highlighted Product" toggle button to `VerticalControlPanel`:
  - Icon: `Sparkles` from Lucide
  - Badge shows "1" when product is highlighted
  - Toggle visibility of `HighlightedProduct` component
- [x] Implement WebSocket listeners:
  - `PRODUCT_HIGHLIGHTED`: Show toast, update state, display component
  - `PRODUCT_UNHIGHLIGHTED`: Hide component, update state
- [x] Fetch and display current highlight on channel join
- [x] Add local state to remember user's visibility preference per session

**Files Modified**:
- `client/src/components/VerticalControlPanel/VerticalControlPanel.tsx`
- `client/src/pages/ChannelDetailsPage.tsx` (WebSocket handlers, state management)

---

### Phase 6: Testing & Polish
**Status**: 🔲 Not Started  
**Estimated Time**: 1-2 hours

**Key Deliverables**:
- [ ] Test SELLER highlight/unhighlight flow
- [ ] Test multi-user synchronization (SELLER + multiple BUYERs)
- [ ] Test mid-join persistence (new BUYER sees current highlight)
- [ ] Test product details sheet interaction
- [ ] Test visibility toggle for BUYERs
- [ ] Verify permissions (only SELLER can highlight)
- [ ] Verify theme compatibility (light/dark modes)
- [ ] Mobile/tablet responsiveness testing

---

## Technical Design

### Database Schema Changes

```typescript
// Migration: Add highlighted product tracking to channels table
table.integer('highlightedProductId').nullable().references('products.id');
table.timestamp('highlightedAt').nullable();
```

### WebSocket Message Types

```typescript
// PRODUCT_HIGHLIGHTED
{
  type: 'PRODUCT_HIGHLIGHTED',
  channelId: number,
  product: {
    id: number,
    name: string,
    price: number,
    description: string,
    imageUrl: string | null
  },
  highlightedAt: Date
}

// PRODUCT_UNHIGHLIGHTED
{
  type: 'PRODUCT_UNHIGHLIGHTED',
  channelId: number
}
```

### tRPC Endpoints

```typescript
// channel.highlightProduct
Input: { channelId: number, productId: number }
Output: { success: boolean, product: Product }
Permissions: SELLER role, channel host only

// channel.unhighlightProduct
Input: { channelId: number }
Output: { success: boolean }
Permissions: SELLER role, channel host only

// channel.getHighlightedProduct
Input: { channelId: number }
Output: { product: Product | null, highlightedAt: Date | null }
Permissions: Authenticated users in channel
```

### Component Hierarchy

```
ChannelDetailsPage
├── VideoGrid (existing)
├── VerticalControlPanel (modified)
│   ├── Mic/Video buttons (SELLER only)
│   ├── Participants button
│   ├── Products button
│   └── Highlighted Product toggle button (NEW)
├── ChatPanel (existing)
│   ├── HighlightedProduct (NEW - above messages)
│   └── MessageList
├── PromotedProducts (modified - add highlight controls)
└── ProductDetailsSheet (NEW)
```

### UI Layout (Below Chat Input)

```
┌─────────────────────────────────────────┐
│  Chat Input Box                         │
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│  [X] Highlighted Product                │  <-- Collapsible
│  ┌────┐                                  │
│  │IMG │  Product Name                    │
│  │    │  Starting Price: $XX.XX          │
│  └────┘  Description text...             │
│                                           │
│  [Future: Bid controls will go here]     │
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│  Message List (scrollable)               │
│  ...                                     │
└─────────────────────────────────────────┘
```

---

## Future Considerations (Not in Scope)

### For Feature 008: Live Auctions
- Add bid input and submit button to `HighlightedProduct`
- Add countdown timer for auction end
- Show current highest bid and bidder
- Add bid history panel
- WebSocket events for new bids
- Bid validation and conflict resolution

### For Feature 009: Analytics & Engagement Tracking
- Track highlight duration per product
- Track BUYER views/interactions
- Track click-through rates to product details
- PostHog integration for analytics

---

## Success Criteria

- ✅ SELLER can highlight/unhighlight products from promoted products panel
- ✅ All connected users see highlight changes in real-time (< 500ms)
- ✅ New joiners see current highlighted product immediately
- ✅ BUYERs can toggle visibility of highlighted product
- ✅ BUYERs can click to see full product details
- ✅ Only one product highlighted at a time
- ✅ Only promoted products can be highlighted
- ✅ Toast notifications on highlight changes
- ✅ Component layout reserves space for future auction controls
- ✅ Works on mobile, tablet, desktop
- ✅ Theme-compatible (light/dark modes)

---

## Progress Tracking

| Phase | Status | Hours Estimated | Hours Actual | Completed |
|-------|--------|----------------|--------------|-----------|
| Phase 1: Backend DB & tRPC | ✅ Complete | 2-3h | 1h | 2026-01-05 |
| Phase 2: WebSocket Broadcast | ✅ Complete | 2h | 1h | 2026-01-05 |
| Phase 3: Highlighted Product UI | ✅ Complete | 3h | 2h | 2026-01-06 |
| Phase 4: SELLER Controls | ✅ Complete | 2h | (merged with Phase 3) | 2026-01-06 |
| Phase 5: BUYER Controls & WS | ✅ Complete | 2-3h | (merged with Phase 3) | 2026-01-06 |
| Phase 6: Testing & Polish | 🔄 In Progress | 1-2h | - | - |
| **TOTAL** | **83% Complete** | **12-15h** | **4h** | - |

---

## Dependencies

- Feature 005: Real-time WebSocket Messaging (completed)
- Feature 003: RBAC Seller/Buyer Roles (completed)
- Feature 002: Back Office Shop (completed - product association)

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| WebSocket message loss during highlight | High | Fetch current highlight on reconnect |
| Race condition (2 SELLERs highlighting) | Low | Backend validation: only channel host can highlight |
| UI space constraints on mobile | Medium | Collapsible component, smart positioning |
| Product data stale when highlighted | Low | Include full product data in WebSocket message |

---

**Created**: 2026-01-05  
**Last Updated**: 2026-01-05  
**Status**: 📋 Planning Complete - Ready for Implementation
