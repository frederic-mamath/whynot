# Phase 1: Setup & Infrastructure

**Status**: To Do  
**Estimated Time**: 2 hours  
**Dependencies**: None

---

## Objectives

- Set up Agora account and obtain credentials
- Install necessary SDKs and dependencies
- Design and implement database schema for channels
- Configure environment variables

---

## Tasks

### 1.1 Agora Account Setup

**Steps**:
1. Create account at https://console.agora.io/
2. Create a new project
3. Obtain App ID and App Certificate
4. Enable the following services:
   - Video Calling
   - Voice Calling
   - Real-time Messaging (optional)

**Credentials Needed**:
- `AGORA_APP_ID`
- `AGORA_APP_CERTIFICATE`

---

### 1.2 Install Dependencies

**Backend Dependencies**:
```bash
npm install agora-access-token
```

**Frontend Dependencies**:
```bash
npm install agora-rtc-react agora-rtc-sdk-ng
```

**Package Purposes**:
- `agora-access-token`: Generate secure tokens for channel access (backend)
- `agora-rtc-sdk-ng`: Core Agora RTC SDK for video/audio streaming (frontend)
- `agora-rtc-react`: React hooks and components for Agora (frontend)

---

### 1.3 Database Schema Design

**New Tables**:

#### Channels Table
```typescript
export const channels = pgTable('channels', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  hostId: integer('host_id').references(() => users.id).notNull(),
  status: varchar('status', { length: 50 }).default('active').notNull(), // active, ended
  maxParticipants: integer('max_participants').default(10),
  isPrivate: boolean('is_private').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  endedAt: timestamp('ended_at'),
});
```

**Fields Explanation**:
- `id`: Unique identifier for the channel
- `name`: Display name of the channel
- `hostId`: User who created the channel
- `status`: Channel state (active/ended)
- `maxParticipants`: Maximum number of participants allowed
- `isPrivate`: Whether the channel is publicly listed
- `createdAt`: Timestamp when channel was created
- `endedAt`: Timestamp when channel ended (null if active)

#### Channel Participants Table
```typescript
export const channelParticipants = pgTable('channel_participants', {
  id: serial('id').primaryKey(),
  channelId: integer('channel_id').references(() => channels.id).notNull(),
  userId: integer('user_id').references(() => users.id).notNull(),
  joinedAt: timestamp('joined_at').defaultNow().notNull(),
  leftAt: timestamp('left_at'),
  role: varchar('role', { length: 50 }).default('audience').notNull(), // host, audience
});
```

**Fields Explanation**:
- `id`: Unique identifier for the participation record
- `channelId`: Reference to the channel
- `userId`: Reference to the user
- `joinedAt`: When the user joined
- `leftAt`: When the user left (null if still in channel)
- `role`: User role (host = can publish, audience = can subscribe)

**Indexes to Add** (for performance):
```typescript
// Add unique constraint to prevent duplicate active participants
index('channel_user_idx').on(channelParticipants.channelId, channelParticipants.userId)
```

---

### 1.4 Update Database Schema File

**Location**: `src/db/schema.ts`

**Add**:
```typescript
import { pgTable, serial, varchar, timestamp, boolean, integer } from 'drizzle-orm/pg-core';

// ... existing users table ...

export const channels = pgTable('channels', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  hostId: integer('host_id').references(() => users.id).notNull(),
  status: varchar('status', { length: 50 }).default('active').notNull(),
  maxParticipants: integer('max_participants').default(10),
  isPrivate: boolean('is_private').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  endedAt: timestamp('ended_at'),
});

export const channelParticipants = pgTable('channel_participants', {
  id: serial('id').primaryKey(),
  channelId: integer('channel_id').references(() => channels.id).notNull(),
  userId: integer('user_id').references(() => users.id).notNull(),
  joinedAt: timestamp('joined_at').defaultNow().notNull(),
  leftAt: timestamp('left_at'),
  role: varchar('role', { length: 50 }).default('audience').notNull(),
});

// Export types
export type Channel = typeof channels.$inferSelect;
export type NewChannel = typeof channels.$inferInsert;
export type ChannelParticipant = typeof channelParticipants.$inferSelect;
export type NewChannelParticipant = typeof channelParticipants.$inferInsert;
```

---

### 1.5 Generate and Apply Migrations

```bash
# Generate migration from schema
npm run db:generate

# Apply migration to database
npm run db:push
```

**Verify**:
```bash
# Check tables were created
docker exec notwhat-postgres psql -U postgres -d notwhat -c "\dt"

# Check channels table structure
docker exec notwhat-postgres psql -U postgres -d notwhat -c "\d channels"

# Check participants table structure
docker exec notwhat-postgres psql -U postgres -d notwhat -c "\d channel_participants"
```

---

### 1.6 Environment Configuration

**Update `.env`**:
```env
# Existing vars
DATABASE_URL=postgres://postgres:postgres@localhost:5432/notwhat
JWT_SECRET=dev-secret-key-change-in-production
PORT=3000

# New Agora credentials
AGORA_APP_ID=your_agora_app_id_here
AGORA_APP_CERTIFICATE=your_agora_app_certificate_here
```

**Update `.env.example`**:
```env
DATABASE_URL=postgres://postgres:postgres@localhost:5432/notwhat
JWT_SECRET=your-secret-key-change-this-in-production
PORT=3000
AGORA_APP_ID=your_agora_app_id
AGORA_APP_CERTIFICATE=your_agora_app_certificate
```

---

## Testing & Validation

**Checklist**:
- [ ] Agora account created and credentials obtained
- [ ] Backend dependencies installed without errors
- [ ] Frontend dependencies installed without errors
- [ ] Database schema updated in `src/db/schema.ts`
- [ ] Migrations generated successfully
- [ ] Migrations applied to database
- [ ] Tables exist in database with correct structure
- [ ] Environment variables configured in `.env`
- [ ] App still runs without errors (`npm run dev`)

---

## Success Criteria

- ✅ Agora credentials available and valid
- ✅ All dependencies installed
- ✅ Database tables created with proper relationships
- ✅ Environment variables configured
- ✅ No breaking changes to existing functionality

---

## Notes

- Keep Agora App Certificate secret - never commit to version control
- Agora free tier allows up to 10,000 free minutes per month
- Consider enabling Agora's recording service for future features
- Database indexes will be added in Phase 3 for optimization

---

## Next Phase

➡️ **Phase 2**: Backend Implementation - Token generation and channel management API
