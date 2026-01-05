# Phase 1: Backend - Database & tRPC Endpoints

**Status**: 🔲 Not Started  
**Estimated Time**: 2-3 hours  
**Dependencies**: None

---

## Objective

Set up the database schema and backend API endpoints to support product highlighting in live channels.

---

## Files to Create/Modify

### New Files
- `migrations/XXXX_add_highlighted_product.ts` - Migration to add highlight tracking

### Modified Files
- `src/server/routers/channel.ts` - Add highlight/unhighlight endpoints
- `src/db/schema.ts` (if applicable) - Update schema types

---

## Steps

### Step 1: Create Database Migration (30 min)

Add columns to track highlighted product in channels table:

```typescript
// migrations/XXXX_add_highlighted_product.ts
export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('channels')
    .addColumn('highlightedProductId', 'integer', (col) =>
      col.references('products.id').onDelete('set null')
    )
    .addColumn('highlightedAt', 'timestamp')
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('channels')
    .dropColumn('highlightedProductId')
    .dropColumn('highlightedAt')
    .execute();
}
```

**Run migration**:
```bash
npm run migrate
```

---

### Step 2: Create tRPC Endpoint - `channel.highlightProduct` (45 min)

**Location**: `src/server/routers/channel.ts`

**Input Schema**:
```typescript
z.object({
  channelId: z.number(),
  productId: z.number()
})
```

**Logic**:
1. Verify user is authenticated
2. Verify user has SELLER role
3. Verify channel exists
4. Verify user is the channel host (creator)
5. Verify product exists and is promoted to this channel
6. Update channel: set `highlightedProductId` and `highlightedAt`
7. Return highlighted product details
8. **Emit WebSocket event** (for Phase 2)

**Response**:
```typescript
{
  success: true,
  product: {
    id: number,
    name: string,
    price: number,
    description: string,
    imageUrl: string | null
  }
}
```

**Error Cases**:
- User not authenticated → 401
- User not SELLER → 403
- User not channel host → 403
- Product not promoted to channel → 400
- Product doesn't exist → 404
- Channel doesn't exist → 404

---

### Step 3: Create tRPC Endpoint - `channel.unhighlightProduct` (30 min)

**Location**: `src/server/routers/channel.ts`

**Input Schema**:
```typescript
z.object({
  channelId: z.number()
})
```

**Logic**:
1. Verify user is authenticated
2. Verify user has SELLER role
3. Verify channel exists
4. Verify user is the channel host
5. Update channel: set `highlightedProductId = null`, `highlightedAt = null`
6. **Emit WebSocket event** (for Phase 2)

**Response**:
```typescript
{ success: true }
```

---

### Step 4: Create tRPC Query - `channel.getHighlightedProduct` (30 min)

**Location**: `src/server/routers/channel.ts`

**Input Schema**:
```typescript
z.object({
  channelId: z.number()
})
```

**Logic**:
1. Verify user is authenticated
2. Verify channel exists
3. If `highlightedProductId` is null → return null
4. Fetch product details (join with products table)
5. Return product + `highlightedAt` timestamp

**Response**:
```typescript
{
  product: {
    id: number,
    name: string,
    price: number,
    description: string,
    imageUrl: string | null
  } | null,
  highlightedAt: Date | null
}
```

---

### Step 5: Add Permission Helper (15 min)

Create reusable helper to check if user is channel host:

```typescript
// src/server/utils/channelPermissions.ts (or similar)
export async function isChannelHost(
  db: Kysely<Database>,
  userId: number,
  channelId: number
): Promise<boolean> {
  const channel = await db
    .selectFrom('channels')
    .select('createdBy')
    .where('id', '=', channelId)
    .executeTakeFirst();
    
  return channel?.createdBy === userId;
}
```

Use this in all three endpoints.

---

### Step 6: Update TypeScript Types (15 min)

If using a schema file, update channel type:

```typescript
// src/db/schema.ts or equivalent
export interface Channel {
  id: number;
  name: string;
  createdBy: number;
  createdAt: Date;
  // ... existing fields
  highlightedProductId: number | null; // NEW
  highlightedAt: Date | null;          // NEW
}
```

---

## Testing Checklist

- [ ] Migration runs successfully (up and down)
- [ ] `highlightProduct` works for channel host
- [ ] `highlightProduct` rejects non-host users
- [ ] `highlightProduct` rejects non-promoted products
- [ ] `unhighlightProduct` works for channel host
- [ ] `unhighlightProduct` sets fields to null
- [ ] `getHighlightedProduct` returns null when no highlight
- [ ] `getHighlightedProduct` returns product when highlighted
- [ ] Permission helper correctly identifies channel host

---

## Acceptance Criteria

✅ Database schema supports tracking one highlighted product per channel  
✅ SELLER (host) can highlight a promoted product via tRPC  
✅ SELLER (host) can unhighlight the current product via tRPC  
✅ Any authenticated user can query the current highlighted product  
✅ Non-hosts cannot highlight/unhighlight (403 error)  
✅ Non-promoted products cannot be highlighted (400 error)  
✅ TypeScript types are updated and compile successfully  

---

## Notes

- WebSocket broadcasting will be added in Phase 2
- Frontend integration will be added in Phases 3-5
- Consider adding database index on `channels.highlightedProductId` for query performance
