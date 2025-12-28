# Phase 1: Database Schema & Backend Setup

**Estimated Time**: 2 hours  
**Status**: ⏳ To Do  
**Dependencies**: None

---

## Objective

Set up the database schema for storing channel messages and prepare backend utilities for message validation.

---

## Files to Create/Modify

### New Files
- `migrations/XXX_add_messages_table.ts` - Database migration for messages table
- `src/utils/validation.ts` - Message content validation utilities (if doesn't exist)

### Files to Modify
- `src/db/schema.ts` - Add messages table schema

---

## Steps

### 1. Create Messages Table Schema

Add to `src/db/schema.ts`:

```typescript
export interface MessagesTable {
  id: Generated<string>;
  channelId: string;
  userId: string;
  content: string;
  createdAt: Generated<Timestamp>;
  deletedAt: Timestamp | null;
}

export interface Database {
  // ... existing tables
  messages: MessagesTable;
}
```

### 2. Create Database Migration

Create `migrations/XXX_add_messages_table.ts`:

```typescript
import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('messages')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`)
    )
    .addColumn('channel_id', 'uuid', (col) =>
      col.references('channels.id').onDelete('cascade').notNull()
    )
    .addColumn('user_id', 'uuid', (col) =>
      col.references('users.id').onDelete('cascade').notNull()
    )
    .addColumn('content', 'varchar(500)', (col) => col.notNull())
    .addColumn('created_at', 'timestamp', (col) =>
      col.defaultTo(sql`now()`).notNull()
    )
    .addColumn('deleted_at', 'timestamp')
    .execute();

  // Create index for efficient queries
  await db.schema
    .createIndex('messages_channel_id_created_at_idx')
    .on('messages')
    .columns(['channel_id', 'created_at'])
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('messages').execute();
}
```

### 3. Create Message Validation Utilities

Create or update `src/utils/validation.ts`:

```typescript
export function validateMessage(content: string): {
  valid: boolean;
  error?: string;
} {
  // Check if empty
  if (!content || content.trim().length === 0) {
    return { valid: false, error: 'Message cannot be empty' };
  }

  // Check length
  if (content.length > 500) {
    return { valid: false, error: 'Message cannot exceed 500 characters' };
  }

  // Basic XSS prevention (sanitize HTML)
  const sanitized = content
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  return { valid: true };
}

export function sanitizeMessage(content: string): string {
  return content
    .trim()
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .slice(0, 500);
}
```

### 4. Run Migration

```bash
npm run migrate
```

### 5. Verify Database Schema

```sql
-- Connect to PostgreSQL
docker exec -it whynot-db psql -U postgres -d whynot

-- Check messages table
\d messages

-- Test insert
INSERT INTO messages (channel_id, user_id, content)
VALUES (
  (SELECT id FROM channels LIMIT 1),
  (SELECT id FROM users LIMIT 1),
  'Test message'
);

-- Test query
SELECT * FROM messages;
```

---

## Acceptance Criteria

- [ ] `messages` table exists in database
- [ ] Foreign key constraints to `channels` and `users` work
- [ ] Index on `channel_id` and `created_at` created
- [ ] Can insert messages via SQL
- [ ] Can query messages by channel
- [ ] `validateMessage()` rejects invalid messages
- [ ] `sanitizeMessage()` removes HTML tags
- [ ] Migration runs without errors
- [ ] Can rollback migration successfully

---

## Testing

### Manual Database Testing

```sql
-- Test foreign key constraint (should fail)
INSERT INTO messages (channel_id, user_id, content)
VALUES ('invalid-uuid', 'invalid-uuid', 'Test');

-- Test max length (should be truncated in app, not DB)
-- This is handled by validation.ts

-- Test soft delete
UPDATE messages SET deleted_at = NOW() WHERE id = 'some-id';

-- Query only non-deleted messages
SELECT * FROM messages WHERE deleted_at IS NULL;
```

### Unit Tests (Optional)

Create `src/utils/validation.test.ts`:

```typescript
import { validateMessage, sanitizeMessage } from './validation';

describe('Message Validation', () => {
  it('rejects empty messages', () => {
    expect(validateMessage('')).toMatchObject({ valid: false });
  });

  it('rejects messages over 500 chars', () => {
    const longMessage = 'a'.repeat(501);
    expect(validateMessage(longMessage)).toMatchObject({ valid: false });
  });

  it('accepts valid messages', () => {
    expect(validateMessage('Hello world')).toMatchObject({ valid: true });
  });

  it('sanitizes HTML', () => {
    expect(sanitizeMessage('<script>alert("xss")</script>'))
      .toBe('&lt;script&gt;alert("xss")&lt;/script&gt;');
  });
});
```

---

## Rollback Plan

If issues occur:

```bash
# Rollback migration
npm run migrate:rollback

# Or manually drop table
docker exec -it whynot-db psql -U postgres -d whynot -c "DROP TABLE messages CASCADE;"
```

---

## Notes

- Use `gen_random_uuid()` for PostgreSQL UUID generation
- Cascade delete messages when channel/user is deleted
- Soft delete with `deleted_at` for audit trail
- Index on `(channel_id, created_at)` for efficient message history queries
- Content length limited to 500 chars at DB level for safety

---

## Status

**Current Status**: ⏳ To Do  
**Last Updated**: 2025-12-28
