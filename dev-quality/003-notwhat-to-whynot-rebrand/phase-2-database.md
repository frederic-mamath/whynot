# Phase 2: Database Configuration

## Objective
Update Docker Compose configuration to use "whynot" database name. Production uses environment variables, so no changes needed there.

## Files to Update

### 1. `docker-compose.yml`
**Changes**:
```yaml
Line 6:  container_name: notwhat-postgres  →  container_name: whynot-postgres
Line 11: POSTGRES_DB: notwhat              →  POSTGRES_DB: whynot
```

## Steps

### 1. Stop Current Database Container
```bash
docker-compose down
```

### 2. Update docker-compose.yml
- Change container name from `notwhat-postgres` to `whynot-postgres`
- Change `POSTGRES_DB` from `notwhat` to `whynot`

### 3. Remove Old Volume (Optional - Data Loss)
**Warning**: This will delete all local data
```bash
docker volume rm whynot_postgres_data
```

**Alternative**: Keep existing volume to preserve data
- The database name inside will still be "notwhat"
- Only cosmetic difference
- Recommended for local development

### 4. Start New Container
```bash
docker-compose up -d
```

### 5. Verify Connection
```bash
# Check container is running
docker ps | grep whynot-postgres

# Test database connection
docker exec -it whynot-postgres psql -U postgres -d whynot -c "SELECT version();"
```

## Environment Variables (Already Updated in Phase 1)

Production and staging use `.env` values:
- `DB_NAME=whynot` ✅ (updated in Phase 1)
- `DATABASE_URL` contains `whynot` ✅ (updated in Phase 1)

**No production changes needed** - environment variables handle everything.

## Validation Checklist

- [ ] docker-compose.yml updated
- [ ] Container name is `whynot-postgres`
- [ ] `POSTGRES_DB` is set to `whynot`
- [ ] Container starts successfully
- [ ] Application connects to database
- [ ] No connection errors in logs

## Acceptance Criteria

- ✅ Docker Compose file uses "whynot" branding
- ✅ Container starts successfully
- ✅ Application connects without errors
- ✅ No references to "notwhat" in docker-compose.yml

## Data Preservation Options

**Option 1: Fresh Start** (Recommended for dev)
- Delete old volume
- Start with empty database
- Run migrations if needed

**Option 2: Keep Existing Data**
- Keep volume as-is
- Database internally named "notwhat" but accessed via "whynot"
- No functional difference

## Estimated Time
**15 minutes**

## Status
⏳ **PENDING** (Requires Phase 1 completion)

## Notes
- Production databases use environment variables - no manual changes needed
- Local Docker setup is for development only
- Choose data preservation option based on local dev needs
