# Phase 3: Database Migration Preparation

## Objective

Document current database schema, prepare migration strategy, and update database connection logic to support Heroku's DATABASE_URL format.

## Duration

~1 hour

## Files to Update

- `src/db/index.ts` - Add DATABASE_URL support
- `.env.example` - Document production DATABASE_URL format
- `package.json` - Add migration scripts for production
- New: `DEPLOYMENT.md` - Document database migration steps

## Current Database Setup

**Local Development**:
- Docker PostgreSQL container
- Individual connection params: `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
- Connection string built from parts

**Heroku Postgres**:
- Provides single `DATABASE_URL` environment variable
- Format: `postgres://user:password@host:port/database`
- Automatically injected by Heroku

## Steps

### 1. Document Current Schema (15 min)

**Create migration snapshot**:

```bash
# Export current schema
npm run migrate

# Document current schema
cat migrations/*.sql > dev-quality/006-heroku-monolith-deployment/schema-snapshot.sql
```

**List all tables and relationships**:
```sql
-- users table
-- rooms table  
-- messages table
-- room_participants table
-- etc.
```

### 2. Update Database Connection Logic (20 min)

**Modify `src/db/index.ts`**:

```typescript
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

// Support both DATABASE_URL (Heroku) and individual params (local dev)
const getDatabaseConfig = () => {
  if (process.env.DATABASE_URL) {
    // Production: Use Heroku DATABASE_URL
    return {
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false, // Required for Heroku Postgres
      },
    };
  } else {
    // Development: Use individual connection params
    return {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'whynot',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
    };
  }
};

export const pool = new Pool(getDatabaseConfig());

// Test connection
pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ Database connection error:', err);
  process.exit(-1);
});

// Export for use in repositories
export const db = pool;
```

**Changes**:
- Detect `DATABASE_URL` and use it if present
- Enable SSL for Heroku Postgres (required)
- Fallback to individual params for local dev

### 3. Update Environment Configuration (10 min)

**Update `.env.example`**:

```bash
# Local Development (Docker)
DATABASE_URL=postgres://postgres:postgres@localhost:5432/whynot
DB_HOST=localhost
DB_PORT=5432
DB_NAME=whynot
DB_USER=postgres
DB_PASSWORD=postgres

# Production (Heroku) - automatically injected by Heroku
# DATABASE_URL=postgres://user:pass@host:port/dbname

JWT_SECRET=your-secret-key-change-this-in-production
PORT=3000
CORS_ORIGIN=http://localhost:5173,http://localhost:3000
AGORA_APP_ID=your_agora_app_id
AGORA_APP_CERTIFICATE=your_agora_app_certificate
VITE_API_URL=http://localhost:3000
NODE_ENV=development
```

### 4. Add Production Migration Scripts (10 min)

**Update `package.json`**:

```json
{
  "scripts": {
    "migrate": "tsx migrate.ts",
    "migrate:prod": "NODE_ENV=production tsx migrate.ts",
    "db:push": "drizzle-kit push",
    "db:generate": "drizzle-kit generate"
  }
}
```

**Note**: Exact migration commands depend on your current ORM setup (check if using Drizzle, Kysely, or raw SQL).

### 5. Create Deployment Documentation (15 min)

**Create `DEPLOYMENT.md`** in project root:

```markdown
# Deployment Guide

## Database Migration Checklist

### Pre-Deployment

- [ ] Export current schema: `pg_dump local_db > backup.sql`
- [ ] Review migration files in `migrations/`
- [ ] Test migrations locally first
- [ ] Document rollback plan

### Heroku Database Setup

1. Provision Postgres add-on:
   ```bash
   heroku addons:create heroku-postgresql:mini
   ```

2. Verify DATABASE_URL is set:
   ```bash
   heroku config:get DATABASE_URL
   ```

3. Run migrations:
   ```bash
   heroku run npm run migrate:prod
   ```

4. Verify schema:
   ```bash
   heroku pg:psql
   \dt  # List tables
   ```

### Rollback Plan

If migration fails:
1. Restore from backup
2. Check error logs: `heroku logs --tail`
3. Fix migration scripts
4. Re-run migrations

## Environment Variables

Required on Heroku:
- `DATABASE_URL` (auto-injected by Postgres add-on)
- `JWT_SECRET` (generate secure random string)
- `NODE_ENV=production`
- `AGORA_APP_ID`
- `AGORA_APP_CERTIFICATE`

Set with:
```bash
heroku config:set JWT_SECRET=your-secret-key
```
```

## Design Considerations

### SSL Requirement

Heroku Postgres **requires SSL** connections:
- Set `ssl: { rejectUnauthorized: false }`
- Without this, connections will fail in production

### Connection Pooling

- Use `pg.Pool` for connection pooling
- Heroku has connection limits (20 for Mini tier)
- Configure max connections:
  ```typescript
  new Pool({
    max: 10, // Leave headroom for manual connections
  });
  ```

### Migration Strategy

**Option A: Manual migrations** (recommended for first deploy)
1. Deploy app without data
2. Run migrations manually via Heroku CLI
3. Verify schema
4. Seed initial data if needed

**Option B: Auto-migrations** (risky for production)
- Run migrations in `npm start` script
- Can cause issues with concurrent deployments

### Database Backups

Heroku Postgres Mini includes:
- Daily automatic backups (last 2 days retained)
- Manual backups: `heroku pg:backups:capture`
- Restore: `heroku pg:backups:restore`

## Acceptance Criteria

- [x] Database connection works with `DATABASE_URL`
- [x] Database connection works with individual params (local dev)
- [x] SSL configured for Heroku Postgres
- [x] Migration scripts documented
- [x] Rollback plan documented
- [x] Environment variables documented in `.env.example`
- [x] `DEPLOYMENT.md` created with step-by-step guide

## Status

📝 **PLANNING** - Ready to begin after Phase 2

## Notes

- Test DATABASE_URL locally before deploying:
  ```bash
  export DATABASE_URL="postgres://user:pass@localhost:5432/whynot"
  npm start
  ```
- Don't commit real DATABASE_URL to git (use Heroku config vars)
- Keep local Docker setup for development - don't replace it
