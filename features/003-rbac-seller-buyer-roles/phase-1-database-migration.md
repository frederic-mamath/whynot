# Phase 1: Database Migration

## Objective
Create `roles` and `user_roles` tables with proper indexes and constraints, and seed default BUYER/SELLER roles.

## Files to Update
- `migrations/008_create_roles.ts` - NEW
- `migrations/009_create_user_roles.ts` - NEW

## Steps

### Step 1: Create roles table migration
```typescript
// migrations/008_create_roles.ts
- Create roles table with id, name, created_at
- Add unique index on name column
- Seed BUYER and SELLER roles
```

### Step 2: Create user_roles table migration
```typescript
// migrations/009_create_user_roles.ts
- Create user_roles table with:
  - user_id (FK to users)
  - role_id (FK to roles)
  - activated_by (FK to users, nullable)
  - activated_at (timestamp, nullable)
  - created_at (timestamp)
- Add unique index on (user_id, role_id)
- Add indexes on user_id and role_id
- Create default BUYER role for all existing users (activated)
```

### Step 3: Run migrations
```bash
npm run migrate
```

## Database Schema

### roles
| Column | Type | Constraints |
|--------|------|-------------|
| id | serial | PRIMARY KEY |
| name | varchar(50) | NOT NULL, UNIQUE |
| created_at | timestamp | NOT NULL, DEFAULT NOW() |

**Initial Data**:
- (1, 'BUYER', NOW())
- (2, 'SELLER', NOW())

### user_roles
| Column | Type | Constraints |
|--------|------|-------------|
| id | serial | PRIMARY KEY |
| user_id | integer | NOT NULL, FK → users.id CASCADE |
| role_id | integer | NOT NULL, FK → roles.id CASCADE |
| activated_by | integer | NULL, FK → users.id SET NULL |
| activated_at | timestamp | NULL |
| created_at | timestamp | NOT NULL, DEFAULT NOW() |

**Indexes**:
- UNIQUE (user_id, role_id)
- INDEX (user_id)
- INDEX (role_id)

## Acceptance Criteria
- ✅ `roles` table created with BUYER and SELLER entries
- ✅ `user_roles` table created with proper constraints
- ✅ All existing users have BUYER role (activated)
- ✅ Migrations run successfully without errors
- ✅ Foreign key constraints work properly

## Rollback Plan
```sql
DROP TABLE IF EXISTS user_roles CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
```

## Status
⏳ NOT STARTED
