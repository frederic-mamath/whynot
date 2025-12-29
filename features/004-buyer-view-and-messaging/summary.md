# Feature 004: Buyer View-Only Mode & Channel Messaging

**Feature Description**: Enable buyers to join channels in view-only mode (no video stream) and send text messages visible to all channel participants.

**Priority**: High  
**Complexity**: Medium  
**Estimated Total Time**: 8-10 hours

---

## Feature Overview

### Goals
- Allow buyers to join channels without publishing video/audio streams
- Enable buyers to send text messages in channels
- Display messages to all channel participants in real-time
- Differentiate between seller (broadcaster) and buyer (viewer) roles
- Maintain message history per channel

### User Stories
**As a buyer:**
- When I access a channel, I only see video/audio from the seller (no video stream creation for me)
- I can send text messages that are associated with the channel
- I can see all messages from other participants in the channel

**As a seller:**
- I can see messages from all buyers in my channel
- I can broadcast video/audio while reading buyer messages

### Tech Stack
- **Backend**: tRPC, Kysely ORM, PostgreSQL
- **Frontend**: React, TypeScript, Shadcn UI
- **Real-time**: WebSocket or tRPC subscriptions for messages
- **Video**: Agora RTC SDK (audience role for buyers)

### Key Metrics
- Message delivery latency: < 500ms
- Message history: Last 100 messages per channel
- Max message length: 500 characters
- Support for emoji and basic text formatting

---

## Implementation Phases

### Phase 1: Database Schema & Backend Setup
**Status**: ✅ Done  
**Estimated Time**: 2 hours  
**Actual Time**: 0.5 hours  
**Completed**: 2025-12-28

**Key Deliverables**:
- [x] Add `messages` table to database
- [x] Update channel schema if needed (track message count)
- [x] Database migrations
- [x] Message validation utilities

**Files to Create/Modify**:
- `migrations/010_create_messages.ts` - Create messages table ✅
- `src/db/schema.ts` - Add messages table schema ✅
- `src/utils/validation.ts` - Message content validation ✅

**Database Schema** (`messages` table):
```typescript
{
  id: uuid (primary key)
  channelId: uuid (foreign key to channels)
  userId: uuid (foreign key to users)
  content: string (max 500 chars)
  createdAt: timestamp
  deletedAt: timestamp (nullable, for soft deletes)
}
```

**Validation Criteria**:
- [x] Messages table created successfully
- [x] Foreign key constraints work
- [x] Database migrations run without errors
- [x] Can insert/query messages via SQL

---

### Phase 2: Backend API Implementation
**Status**: ⏳ To Do  
**Estimated Time**: 2-3 hours  
**Dependencies**: Phase 1 completed

**Key Deliverables**:
- [ ] Message tRPC router (send, list, delete)
- [ ] Real-time message subscriptions (WebSocket or polling)
- [ ] Message validation and sanitization
- [ ] Rate limiting for message sending
- [ ] Access control (only channel participants can send)

**Files to Create/Modify**:
- `src/routers/message.ts` - Message management API
- `src/routers/index.ts` - Register message router
- `src/routers/channel.ts` - Update join endpoint to return user role

**API Endpoints**:
- `message.send` - Send message to channel
- `message.list` - Get channel message history
- `message.subscribe` - Real-time message updates
- `message.delete` - Delete own message (soft delete)
- `channel.join` - Updated to accept `role` parameter (publisher/audience)

**Validation Criteria**:
- [ ] Can send messages to a channel
- [ ] Can retrieve message history
- [ ] Real-time updates work
- [ ] Only participants can send messages
- [ ] Rate limiting prevents spam
- [ ] Message content is sanitized (prevent XSS)

---

### Phase 3: Frontend - View-Only Mode for Buyers
**Status**: ⏳ To Do  
**Estimated Time**: 2 hours  
**Dependencies**: Phase 2 completed

**Key Deliverables**:
- [ ] Update channel join logic to use "audience" role for buyers
- [ ] Hide video/audio publish controls for buyers
- [ ] Show "View-Only" indicator for buyers
- [ ] Only seller can publish video/audio streams
- [ ] Buyers automatically join as audience

**Files to Create/Modify**:
- `client/src/pages/Channel/ChannelPage.tsx` - Update Agora client setup
- `client/src/hooks/useUserRole.ts` - Hook to determine user role (seller/buyer)
- `client/src/components/RoleBadge/` - Display user role badge

**User Role Logic**:
- Check user role from backend (RBAC feature 003)
- If `role === "buyer"`, join Agora as audience (no publish)
- If `role === "seller"`, join Agora as publisher (can publish)

**Validation Criteria**:
- [ ] Buyers join channel without publishing video/audio
- [ ] Buyers can see seller's video/audio
- [ ] Buyers cannot access video/audio controls
- [ ] Role badge displays correctly
- [ ] Agora SDK uses correct client role

---

### Phase 4: Frontend - Channel Messaging UI
**Status**: ⏳ To Do  
**Estimated Time**: 2-3 hours  
**Dependencies**: Phase 2, Phase 3 completed

**Key Deliverables**:
- [ ] Chat panel component (sidebar or bottom overlay)
- [ ] Message input with send button
- [ ] Message list with auto-scroll
- [ ] Real-time message updates
- [ ] User avatars and names in messages
- [ ] Timestamp display
- [ ] Loading states and error handling

**Files to Create/Modify**:
- `client/src/components/ui/ChatPanel/` - Chat panel component
- `client/src/components/ui/MessageInput/` - Message input component
- `client/src/components/ui/MessageList/` - Message list component
- `client/src/components/ui/Message/` - Single message component
- `client/src/pages/Channel/ChannelPage.tsx` - Integrate chat panel

**UI Design**:
- Chat panel on right side (desktop) or bottom sheet (mobile)
- Shadcn ScrollArea for message list
- Shadcn Input + Button for message input
- Lucide icons: Send, User, Clock
- Auto-scroll to latest message
- "Typing..." indicator (optional enhancement)

**Validation Criteria**:
- [ ] Can type and send messages
- [ ] Messages appear in real-time for all users
- [ ] Chat panel is responsive (mobile/desktop)
- [ ] Message list auto-scrolls to bottom
- [ ] User names and timestamps display correctly
- [ ] Empty state when no messages

---

## Phase Status Summary

| Phase | Status | Progress | Time Est. | Time Actual | Completion Date |
|-------|--------|----------|-----------|-------------|-----------------|
| Phase 1: Database | ✅ Done | 100% | 2h | 0.5h | 2025-12-28 |
| Phase 2: Backend API | ⏳ To Do | 0% | 2-3h | - | - |
| Phase 3: View-Only Mode | ⏳ To Do | 0% | 2h | - | - |
| Phase 4: Messaging UI | ⏳ To Do | 0% | 2-3h | - | - |
| **Total** | **🚧 In Progress** | **25%** | **8-10h** | **0.5h** | **-** |

**Legend**:
- ⏳ To Do
- 🚧 In Progress
- ✅ Done
- ❌ Blocked

---

## Technical Decisions

### Why View-Only for Buyers?
- Reduces bandwidth requirements for buyers
- Simplifies UI/UX (buyers are viewers, not broadcasters)
- Aligns with e-commerce use case (seller demonstrates products)
- Prevents audio/video chaos with many buyers

### Why Text Chat?
- Essential for buyer-seller interaction
- Low bandwidth compared to voice/video
- Allows multiple buyers to ask questions
- Can be archived for later review
- Easy to moderate and filter

### Agora Role Mapping
- **Seller** → `ClientRole.Host` (can publish video/audio)
- **Buyer** → `ClientRole.Audience` (can only subscribe)

### Message Delivery Strategy
- **Option 1**: WebSocket subscriptions (real-time, complex)
- **Option 2**: tRPC subscriptions (real-time, integrated)
- **Option 3**: Polling (simple, higher latency)
- **Chosen**: tRPC subscriptions for consistency with existing stack

---

## Testing Plan

### Unit Tests (Future)
- Message validation
- Message sanitization
- Role-based access control

### Integration Tests (Future)
- Send message flow
- Message subscription updates
- View-only mode enforcement

### Manual Testing
- [ ] Buyer joins channel without video/audio
- [ ] Buyer can see seller's stream
- [ ] Buyer can send messages
- [ ] Messages appear for all participants
- [ ] Seller can send messages while streaming
- [ ] Message history loads on channel join
- [ ] Rate limiting prevents spam
- [ ] XSS protection works (try sending `<script>` tags)
- [ ] Mobile responsive chat UI
- [ ] Multiple buyers can message simultaneously

---

## Known Limitations

### Current Constraints
- No private messaging (DMs)
- No message reactions/emoji reactions
- No file/image sharing in chat
- No message editing (only delete)
- No read receipts
- No typing indicators
- No message search

### Browser Compatibility
- Chat: ✅ All modern browsers
- WebSocket: ✅ All modern browsers
- View-only mode: ✅ All Agora-supported browsers

### Performance
- Message history limited to last 100 messages
- No pagination for older messages (can add later)
- Subscriptions may need optimization for 50+ participants

---

## Security Considerations

### Message Validation
- Max 500 characters per message
- HTML sanitization to prevent XSS
- Rate limiting: 10 messages per minute per user
- Only authenticated users can send messages
- Only channel participants can send messages

### Access Control
- Check user is in channel before allowing messages
- Verify user role before allowing Agora publish
- Soft delete messages (maintain audit trail)

---

## Integration with Existing Features

### Dependencies
- **Feature 003**: RBAC (seller/buyer roles)
  - Use `user.role` to determine Agora client role
  - Check role before allowing video/audio publish
- **Feature 001**: Live streaming
  - Extend existing channel infrastructure
  - Reuse Agora integration
  - Add chat alongside video

### Files to Modify
- `client/src/pages/Channel/ChannelPage.tsx`
- `src/routers/channel.ts`
- Database schema

---

## Future Enhancements

### Short Term (1-2 weeks)
- [ ] Typing indicators
- [ ] Message reactions (👍, ❤️, etc.)
- [ ] Link previews in messages

### Medium Term (1-2 months)
- [ ] Private messaging between buyer and seller
- [ ] Image/file sharing
- [ ] Message search
- [ ] Emoji picker

### Long Term (3-6 months)
- [ ] Message moderation dashboard
- [ ] AI-powered spam detection
- [ ] Message translation (multi-language)
- [ ] Voice messages

---

## Resources & References

### Documentation
- [Agora Client Roles](https://docs.agora.io/en/video-calling/get-started/authentication-workflow#role)
- [tRPC Subscriptions](https://trpc.io/docs/subscriptions)
- [Shadcn Chat Components](https://ui.shadcn.com/examples/dashboard)

### Examples
- [Chat UI Patterns](https://github.com/shadcn-ui/ui/tree/main/apps/www/app/examples)
- [WebSocket Chat Examples](https://github.com/trpc/trpc/tree/main/examples/websockets)

---

## Change Log

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2025-12-28 | 1.0 | Initial feature documentation | Assistant |
| 2025-12-28 | 1.1 | Phase 1 completed (Database setup) | Assistant |

---

## Notes

- Ensure RBAC (feature 003) is completed before Phase 3
- Consider message retention policy (delete old messages after X days)
- Monitor WebSocket connection stability
- Add analytics to track message volume per channel
- Consider profanity filter for message content

---

## Sign-off

### Development Team
- [ ] Backend Developer - Reviewed
- [ ] Frontend Developer - Reviewed
- [ ] DevOps - Infrastructure ready
- [ ] QA - Test plan reviewed

### Product Team
- [ ] Product Manager - Requirements approved
- [ ] Design - UI/UX approved

---

**Last Updated**: 2025-12-28  
**Status**: Phase 1 Complete (25% done), Ready for Phase 2 (Backend API Implementation)
