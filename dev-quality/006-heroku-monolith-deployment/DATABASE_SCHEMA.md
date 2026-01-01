# Database Schema Documentation

## Current Schema (as of Phase 6)

### Tables Overview

1. **users** - User accounts and authentication
2. **channels** - Live streaming channels
3. **channel_participants** - Users participating in channels
4. **shops** - Vendor shops
5. **user_shop_roles** - User roles within shops
6. **products** - Products available in shops
7. **channel_products** - Products promoted in channels
8. **vendor_promoted_products** - Vendor's promoted products
9. **roles** - System roles
10. **user_roles** - User role assignments
11. **messages** - Chat messages in channels

## Migration Status

### Local Development
- ✅ All migrations (000-010) tested locally
- ✅ Schema matches application code
- ✅ Foreign key constraints verified

### Production (Heroku)
- ⏳ Pending - will be run during deployment

## Running Migrations

### Local (Docker PostgreSQL)
```bash
npm run migrate
```

### Production (Heroku)
```bash
heroku run npm run migrate:prod
```

## Migration Files

All migrations located in `migrations/`:

```
000_create_users.ts
001_create_channels.ts
002_create_shops.ts
003_create_user_shop_roles.ts
004_create_products.ts
005_create_channel_products.ts
006_create_vendor_promoted_products.ts
007_add_user_names.ts
008_create_roles.ts
009_create_user_roles.ts
010_create_messages.ts
```

## Schema Details

### Core Tables

#### users
- Primary user authentication table
- Email/password based auth
- Email verification support
- Timestamps for auditing

#### channels
- Live streaming channels/rooms
- Host reference to users
- Status tracking (active/ended)
- Participant limits
- Privacy controls

#### channel_participants
- Many-to-many relationship between users and channels
- Role-based participation (host/audience)
- Join/leave timestamps

#### shops
- Vendor shop management
- Owner reference to users
- Shop metadata (name, description)

#### products
- Product catalog
- Shop association
- Pricing and stock management

### Supporting Tables

#### user_shop_roles
- Permissions within shops
- Role-based access control

#### channel_products
- Products promoted in live channels
- Links channels to products

#### vendor_promoted_products
- Featured/promoted products
- Marketing priority

#### roles & user_roles
- System-wide role management
- User permission assignments

#### messages
- Chat functionality
- Channel-based messaging
- User attribution

## Foreign Key Relationships

```
users
  ↓ (host_id)
channels
  ↓ (channel_id)
channel_participants
  ↑ (user_id)
users

users
  ↓ (owner_id)
shops
  ↓ (shop_id)
products
  ↓ (product_id)
channel_products
  ↑ (channel_id)
channels
```

## Backup Strategy

### Before Production Migration

1. Export local schema:
   ```bash
   pg_dump -h localhost -p 5432 -U postgres -s whynot > schema_backup.sql
   ```

2. Export local data (if needed):
   ```bash
   pg_dump -h localhost -p 5432 -U postgres -a whynot > data_backup.sql
   ```

### Heroku Backups

Automatic backups included with Postgres Mini:
- Daily backups
- 2-day retention
- Manual backups: `heroku pg:backups:capture`

## Rollback Plan

If migration fails on Heroku:

1. Check error logs:
   ```bash
   heroku logs --tail
   ```

2. Reset database (if needed):
   ```bash
   heroku pg:reset DATABASE_URL --confirm <app-name>
   ```

3. Re-run migrations:
   ```bash
   heroku run npm run migrate:prod
   ```

## Verification Queries

After migration, verify schema:

```sql
-- Count tables
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_schema = 'public';

-- List all tables
\dt

-- Check foreign keys
SELECT 
  tc.table_name, 
  kcu.column_name,
  ccu.table_name AS foreign_table_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY';

-- Verify data
SELECT 'users' as table_name, COUNT(*) FROM users
UNION ALL
SELECT 'channels', COUNT(*) FROM channels
UNION ALL
SELECT 'shops', COUNT(*) FROM shops;
```

## Post-Migration Checklist

- [ ] All 11 tables created
- [ ] Foreign keys established
- [ ] Indexes created
- [ ] Default values set
- [ ] Constraints enforced
- [ ] No migration errors in logs
- [ ] Test data inserted successfully (if applicable)

## Notes

- Migration system: Kysely Migrator
- Migration format: TypeScript files
- Execution order: Alphabetical (000, 001, 002, ...)
- Idempotent: Kysely tracks executed migrations
- Safe to re-run: Only pending migrations execute
