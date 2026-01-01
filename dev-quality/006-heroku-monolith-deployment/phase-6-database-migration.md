# Phase 6: Database Migration

## Objective

Migrate the database schema from local Docker PostgreSQL to Heroku Postgres, verify data integrity, and test database connectivity from the deployed application.

## Duration

~1 hour

## Prerequisites

- Phase 4 completed (Heroku app created, Postgres provisioned)
- Phase 3 completed (Database connection logic updated)
- Migrations ready and tested locally

## Steps

### 1. Backup Local Database (10 min)

```bash
# Start local Docker database
docker-compose up -d

# Export current schema and data
pg_dump -h localhost -p 5432 -U postgres whynot > local_backup.sql

# Verify backup file
wc -l local_backup.sql
cat local_backup.sql | grep "CREATE TABLE"
```

**Why**: Always have a backup before migrating production data.

### 2. Review Migration Files (10 min)

```bash
# List all migration files
ls -la migrations/

# Review each migration
cat migrations/*.sql

# Verify migrations run locally
npm run migrate

# Check local tables
psql -h localhost -p 5432 -U postgres whynot -c "\dt"
```

**Checklist**:
- [ ] All migrations present in `migrations/` directory
- [ ] Migrations run without errors locally
- [ ] Schema matches current application code

### 3. Connect to Heroku Database (5 min)

```bash
# Get database credentials
heroku pg:info

# Connect to database via psql
heroku pg:psql

# Inside psql:
\dt    # List tables (should be empty initially)
\q     # Quit
```

### 4. Run Migrations on Heroku (15 min)

**Option A: Via Heroku CLI** (recommended):

```bash
# Run migration script on Heroku dyno
heroku run npm run migrate:prod

# Expected output:
# Running migrations...
# ✅ Migration 001_create_users completed
# ✅ Migration 002_create_rooms completed
# ...
```

**Option B: Manual SQL execution**:

```bash
# If using raw SQL migrations
heroku pg:psql < migrations/001_initial_schema.sql
```

### 5. Verify Schema (10 min)

```bash
# Connect to Heroku database
heroku pg:psql

# Verify tables exist
\dt

# Check table structure
\d users
\d rooms
\d messages
# etc.

# Verify indexes
\di

# Exit
\q
```

**Expected tables** (based on your schema):
- `users`
- `rooms`
- `room_participants`
- `messages`
- `migrations` (if using migration tracking)

### 6. Test Database Connection from App (5 min)

```bash
# Test database connection via one-off dyno
heroku run node -e "require('./dist/db').pool.query('SELECT NOW()').then(r => console.log(r.rows))"

# Should output current timestamp from database
```

### 7. Seed Initial Data (Optional, 5 min)

If you need seed data:

```bash
# Create seed script: src/seed.ts
# Run on Heroku:
heroku run npm run seed

# Or manually via psql:
heroku pg:psql
# INSERT INTO users ...
```

### 8. Monitor Database Performance (5 min)

```bash
# Check database metrics
heroku pg:info

# View active connections
heroku pg:ps

# Check database size
heroku pg:info | grep "Rows"
```

## Design Considerations

### Migration Strategy

**Fresh Database** (recommended for first deploy):
1. Start with empty Heroku Postgres
2. Run all migrations from scratch
3. No data migration needed

**Data Migration** (if migrating existing users):
1. Export data from local: `pg_dump --data-only`
2. Import to Heroku: `heroku pg:psql < data.sql`
3. Verify data integrity

### Connection Pool Limits

Heroku Postgres Mini: **20 max connections**

Configure in `src/db/index.ts`:
```typescript
new Pool({
  max: 10, // Reserve 10 for manual connections/migrations
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
})
```

### Migration Rollback

If migration fails:

```bash
# Drop all tables
heroku pg:psql
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS rooms CASCADE;
# etc.

# Re-run migrations
heroku run npm run migrate:prod
```

Or reset database completely:
```bash
heroku pg:reset DATABASE_URL --confirm your-app-name
heroku run npm run migrate:prod
```

### SSL Connection

Verify SSL is enabled in `src/db/index.ts`:
```typescript
const config = {
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Required for Heroku
  },
};
```

## Troubleshooting

### "password authentication failed"
- Check DATABASE_URL: `heroku config:get DATABASE_URL`
- Verify SSL enabled in connection config

### "too many connections"
- Reduce pool size: `max: 5`
- Close unused connections
- Check for connection leaks

### Migration fails mid-way
- Check logs: `heroku logs --tail`
- Review error message
- Rollback: `DROP TABLE ...`
- Fix migration file
- Re-run

### Schema mismatch
- Compare local vs Heroku: `\d tablename`
- Check migration order
- Verify all migrations ran

## Acceptance Criteria

- [x] Local database backed up
- [x] Heroku Postgres provisioned and accessible
- [x] Migrations run successfully on Heroku
- [x] All tables exist in Heroku database
- [x] Schema matches application code
- [x] Database connection works from Heroku dyno
- [x] Connection pool configured correctly
- [x] SSL enabled for Heroku connection
- [x] No errors in `heroku logs` related to database

## Status

📝 **PLANNING** - Ready to begin after Phase 5

## Validation Queries

After migration, run these to verify:

```sql
-- Count tables
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_schema = 'public';

-- List all tables
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public';

-- Check for foreign keys
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

-- Test basic query
SELECT COUNT(*) FROM users;
```

## Post-Migration Checklist

- [ ] All tables created
- [ ] Indexes created
- [ ] Foreign keys enforced
- [ ] Triggers created (if any)
- [ ] Seed data inserted (if needed)
- [ ] Connection pool working
- [ ] No connection leaks
- [ ] Backup plan documented

## Notes

### Heroku Postgres Backups

Automatic backups (Mini tier):
- Daily backups
- Retained for 2 days
- View backups: `heroku pg:backups`

Manual backup:
```bash
# Create backup
heroku pg:backups:capture

# Download backup
heroku pg:backups:download

# Restore backup
heroku pg:backups:restore b001 DATABASE_URL
```

### Database Monitoring

```bash
# View cache hit rate (should be >99%)
heroku pg:diagnose

# View slow queries
heroku pg:outliers

# View blocking queries
heroku pg:blocking
```

### Migration Best Practices

1. **Test locally first** - Always run migrations on local DB before Heroku
2. **One-way migrations** - Avoid rollbacks, create new migrations instead
3. **Small batches** - Break large migrations into smaller steps
4. **Backup before migrate** - Always create manual backup
5. **Monitor during migration** - Watch logs in real-time
