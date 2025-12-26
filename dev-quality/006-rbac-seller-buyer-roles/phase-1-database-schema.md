# Phase 1: Database Schema Migration

## Objective
Create the new RBAC database schema with `roles` and `user_roles` tables, migrate existing data, and remove old `user_shop_roles` table.

## Files to Update

### New Migration Files
- `migrations/008_create_roles_table.ts`
- `migrations/009_create_user_roles_table.ts`
- `migrations/010_seed_default_roles.ts`
- `migrations/011_assign_buyer_role_to_users.ts`
- `migrations/012_drop_user_shop_roles.ts`

## Database Schema

### `roles` Table
```sql
CREATE TABLE roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Initial Data**:
- BUYER: "Can browse and purchase products"
- SELLER: "Can create channels and sell products"

### `user_roles` Table
```sql
CREATE TABLE user_roles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  activated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  activated_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, role_id)
);
```

**Indexes**:
- `user_roles_user_id_idx` on `user_id`
- `user_roles_role_id_idx` on `role_id`
- `user_roles_activated_idx` on `activated_at` (for filtering active/pending)

## Steps

1. **Create `roles` table** (`008_create_roles_table.ts`)
   - Define table with id, name, description, created_at
   - Add unique constraint on name
   - Create index on name for fast lookups

2. **Create `user_roles` table** (`009_create_user_roles_table.ts`)
   - Define table with foreign keys to users and roles
   - Add activation tracking (activated_by, activated_at)
   - Add unique constraint (user_id, role_id)
   - Create indexes for performance

3. **Seed default roles** (`010_seed_default_roles.ts`)
   - Insert "BUYER" role
   - Insert "SELLER" role

4. **Assign BUYER role to all users** (`011_assign_buyer_role_to_users.ts`)
   - Query all existing users
   - Create user_roles entry for each with BUYER role
   - Set activated_at = NOW() and activated_by = NULL (system activation)

5. **Drop old table** (`012_drop_user_shop_roles.ts`)
   - Drop `user_shop_roles` table
   - Remove associated indexes

## Design Considerations

### Activation Status
- `activated_at IS NULL` → Pending (user requested, awaiting approval)
- `activated_at IS NOT NULL` → Active (role is active)

### Default Role Assignment
- All users automatically get "BUYER" role on signup
- This will be handled in user creation logic (Phase 2)

### Migration Strategy
- Don't migrate old `user_shop_roles` data to new system
- Just drop the table since it's being replaced
- All users start fresh with BUYER role only

## Acceptance Criteria
- [x] `roles` table created with BUYER and SELLER roles
- [x] `user_roles` table created with proper constraints and indexes
- [x] All existing users have activated BUYER role
- [x] `user_shop_roles` table dropped
- [x] Migrations run successfully without errors
- [x] Down migrations reverse all changes correctly

## Testing
```bash
# Run migrations
npm run migrate

# Verify in database
psql -d whynot_db -c "SELECT * FROM roles;"
psql -d whynot_db -c "SELECT COUNT(*) FROM user_roles WHERE activated_at IS NOT NULL;"
psql -d whynot_db -c "\d user_shop_roles" # Should error (table doesn't exist)
```

## Status
📝 **PLANNING** - Ready to implement

## Notes
- Keep migration files separate for easier rollback if needed
- Ensure proper ordering of migrations (roles before user_roles)
- Down migrations should restore original state for development safety
