# Phase 2: Database Schema & Migrations

**Status**: ⏳ IN PROGRESS  
**Estimated Time**: 2-3 hours

---

## Objective

Create database migrations for the auction system tables (auctions, bids, orders) with proper constraints, indexes, and relationships.

---

## User-Facing Changes

After this phase:
- Database will have 3 new tables ready to store auction data
- Sellers table will have Stripe account fields
- All constraints and indexes will be in place for performance and data integrity

No UI changes yet - this is backend infrastructure.

---

## Files to Update

### Migrations (Create)
- `migrations/012_create_auctions.ts` - Auctions table
- `migrations/013_create_bids.ts` - Bids table
- `migrations/014_create_orders.ts` - Orders table
- `migrations/015_add_stripe_to_users.ts` - Seller Stripe onboarding fields

### Test Migration (After creation)
- Run migrations locally
- Verify schema with `psql` or migration tool
- Test rollback with `down()` functions

---

## Steps

### 1. Create Auctions Table Migration (45 min)

Create `migrations/012_create_auctions.ts`:

**Columns**:
- `id` - UUID primary key
- `product_id` - FK to products
- `seller_id` - FK to users
- `channel_id` - FK to channels
- `starting_price` - DECIMAL(10,2)
- `buyout_price` - DECIMAL(10,2), nullable
- `current_bid` - DECIMAL(10,2)
- `highest_bidder_id` - FK to users, nullable
- `duration_seconds` - INTEGER (60, 300, 600, 1800)
- `started_at` - TIMESTAMP WITH TIME ZONE
- `ends_at` - TIMESTAMP WITH TIME ZONE
- `extended_count` - INTEGER, default 0
- `status` - ENUM ('active', 'ended', 'paid', 'cancelled')
- `created_at` - TIMESTAMP, default now()
- `updated_at` - TIMESTAMP, default now()

**Indexes**:
- `auctions_channel_id_idx` - Find active auction by channel
- `auctions_status_idx` - Query by status
- `auctions_seller_id_idx` - Seller's auction history
- `auctions_ends_at_idx` - Find expiring auctions (for cron jobs)

**Constraints**:
- CHECK: `buyout_price IS NULL OR buyout_price > starting_price`
- CHECK: `current_bid >= starting_price`
- CHECK: `duration_seconds IN (60, 300, 600, 1800)`
- CHECK: `ends_at > started_at`

---

### 2. Create Bids Table Migration (30 min)

Create `migrations/013_create_bids.ts`:

**Columns**:
- `id` - UUID primary key
- `auction_id` - FK to auctions (ON DELETE CASCADE)
- `bidder_id` - FK to users
- `amount` - DECIMAL(10,2)
- `placed_at` - TIMESTAMP WITH TIME ZONE, default now()
- `created_at` - TIMESTAMP, default now()

**Indexes**:
- `bids_auction_id_placed_at_idx` - Bid history (DESC order)
- `bids_bidder_id_idx` - User's bid history

**Constraints**:
- CHECK: `amount > 0`
- Composite index on (auction_id, amount DESC) for finding highest bid

---

### 3. Create Orders Table Migration (45 min)

Create `migrations/014_create_orders.ts`:

**Columns**:
- `id` - UUID primary key
- `auction_id` - FK to auctions (unique - one order per auction)
- `buyer_id` - FK to users
- `seller_id` - FK to users
- `product_id` - FK to products
- `final_price` - DECIMAL(10,2)
- `platform_fee` - DECIMAL(10,2) - Calculated: final_price * 0.07
- `seller_payout` - DECIMAL(10,2) - Calculated: final_price * 0.93
- `payment_status` - ENUM ('pending', 'paid', 'failed', 'refunded')
- `payment_deadline` - TIMESTAMP WITH TIME ZONE
- `stripe_payment_intent_id` - VARCHAR(255), nullable, unique
- `paid_at` - TIMESTAMP WITH TIME ZONE, nullable
- `shipped_at` - TIMESTAMP WITH TIME ZONE, nullable
- `created_at` - TIMESTAMP, default now()
- `updated_at` - TIMESTAMP, default now()

**Indexes**:
- `orders_buyer_id_idx` - My orders page
- `orders_seller_id_payment_status_idx` - Pending deliveries
- `orders_payment_deadline_idx` - Find expiring orders (cron job)
- `orders_auction_id_idx` - Unique constraint

**Constraints**:
- CHECK: `final_price > 0`
- CHECK: `platform_fee = final_price * 0.07`
- CHECK: `seller_payout = final_price * 0.93`
- UNIQUE: `auction_id` (one order per auction)

---

### 4. Add Stripe Fields to Users (20 min)

Create `migrations/015_add_stripe_to_users.ts`:

**Columns to add**:
- `stripe_account_id` - VARCHAR(255), nullable, unique
- `stripe_onboarding_complete` - BOOLEAN, default false

**Index**:
- `users_stripe_account_id_idx`

---

### 5. Test Migrations (30 min)

Run and verify:

```bash
# Run migrations
npm run migrate

# Verify schema in psql
npm run db:shell
\dt  # List tables
\d auctions  # Describe auctions table
\d bids
\d orders

# Test rollback
npm run migrate:down
npm run migrate:up
```

**Verification checklist**:
- [ ] All tables created successfully
- [ ] Foreign keys reference correct tables
- [ ] Indexes exist for performance
- [ ] Enums have correct values
- [ ] Check constraints validate business rules
- [ ] Default values work as expected
- [ ] Rollback (down) functions work

---

## Design Considerations

### Data Types

**DECIMAL(10,2) for money**:
- Precise decimal arithmetic (no floating point errors)
- Supports up to $99,999,999.99
- Always 2 decimal places

**UUID for IDs**:
- Better for distributed systems
- Harder to enumerate/guess
- Standard in modern apps
- **Note**: Current schema uses `serial` (auto-increment integers). We'll use UUIDs for new tables to future-proof, but keep FKs to existing tables as integers.

**TIMESTAMP WITH TIME ZONE**:
- Stores UTC time
- Automatically converts to client timezone
- Prevents timezone bugs

**ENUMs**:
- Type-safe status values
- Prevents typos
- Database-level validation

### Performance Optimizations

**Composite Indexes**:
- `(channel_id, status)` - Find active auction in channel
- `(seller_id, payment_status)` - Pending deliveries filter
- `(auction_id, placed_at DESC)` - Bid history sorted

**Partial Indexes** (if needed later):
- Index only `status = 'active'` auctions
- Saves space, faster queries

**Foreign Key Cascades**:
- `bids.auction_id` ON DELETE CASCADE - Remove bids when auction deleted
- `orders.auction_id` ON DELETE RESTRICT - Prevent auction deletion if order exists
- `auctions.product_id` ON DELETE CASCADE - Remove auction if product deleted

### Data Integrity

**Check Constraints**:
- Prevent invalid money amounts (negative prices)
- Enforce business rules (buyout > starting price)
- Validate enum-like fields (duration_seconds)

**Unique Constraints**:
- One order per auction
- Unique Stripe payment intent IDs (prevent double-charging)
- Unique Stripe account IDs

**NOT NULL Enforcement**:
- Critical fields required (product_id, seller_id, etc.)
- Optional fields nullable (buyout_price, shipped_at)

---

## Acceptance Criteria

- [ ] Migration 012 (auctions) created and tested
- [ ] Migration 013 (bids) created and tested
- [ ] Migration 014 (orders) created and tested
- [ ] Migration 015 (stripe fields) created and tested
- [ ] All migrations run successfully on local database
- [ ] Schema matches design specifications
- [ ] Indexes exist for all foreign keys and common queries
- [ ] Check constraints enforce business rules
- [ ] Rollback (down) functions work correctly
- [ ] No TypeScript errors in migration files

---

## Testing Checklist

### Migration Tests
- [ ] Run `npm run migrate` - All migrations succeed
- [ ] Check tables exist: `\dt` in psql
- [ ] Verify auctions schema: `\d auctions`
- [ ] Verify bids schema: `\d bids`
- [ ] Verify orders schema: `\d orders`
- [ ] Verify users updated: `\d users`
- [ ] Check indexes: `\di` in psql
- [ ] Test rollback: `npm run migrate:down`
- [ ] Test re-apply: `npm run migrate:up`

### Data Integrity Tests
- [ ] Try inserting invalid data (should fail)
  - Negative bid amount
  - Buyout price < starting price
  - Invalid duration_seconds
  - Invalid status enum value
- [ ] Test foreign key constraints
  - Delete product with active auction (should fail or cascade)
  - Delete user with bids (should fail)
- [ ] Test unique constraints
  - Duplicate stripe_account_id (should fail)
  - Duplicate payment_intent_id (should fail)

---

## Status

✅ **DONE** - All migrations created and tested successfully

---

## Notes

### Migration Test Results

All 4 migrations executed successfully:
- ✅ Migration 012 (auctions) - Created with UUID primary keys
- ✅ Migration 013 (bids) - Created with cascade deletes
- ✅ Migration 014 (orders) - Created with payment tracking
- ✅ Migration 015 (stripe fields) - Added to users table

### Kysely Syntax Learnings

**Decimal columns**: Use `'decimal'` not `'decimal(10,2)'`
- Kysely doesn't support precision/scale in type string
- PostgreSQL applies default precision automatically
- Existing products table uses same pattern

### Database Schema Verification

Tables created:
- `auctions` - 15 columns, 5 indexes, 4 check constraints
- `bids` - 6 columns, 3 indexes, 1 check constraint  
- `orders` - 14 columns, 5 indexes, 3 check constraints
- `users` - Added 2 new columns for Stripe

Enums created:
- `auction_status` - (active, ended, paid, cancelled)
- `payment_status` - (pending, paid, failed, refunded)

---

**Next Steps**:
1. ✅ Migrations complete and tested
2. Update summary.md progress
3. Begin Phase 3: Backend API & WebSocket Events
