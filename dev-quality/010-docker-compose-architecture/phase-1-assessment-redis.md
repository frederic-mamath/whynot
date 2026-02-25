# Phase 1: Assessment & Redis Setup

**Duration**: 2 hours  
**Status**: ✅ Completed

---

## 🎯 Objective

Audit the existing Docker setup, add Redis to docker-compose, and validate the database configuration works correctly.

---

## 📋 Tasks

### Task 1.1: Audit Existing Docker Setup (30min)

**Goal**: Understand current docker-compose.yml and verify postgres works.

**Steps**:

1. Review existing `docker-compose.yml`
   - Verify postgres configuration
   - Check volume mapping (`postgres_data`)
   - Validate port mapping (54321:5432)

2. Test current postgres container

   ```bash
   docker-compose up postgres -d
   docker ps  # Verify container running
   ```

3. Test database connection

   ```bash
   # From host machine
   psql -h localhost -p 54321 -U postgres -d whynot
   # Or using any DB client (Postico, TablePlus, etc.)
   ```

4. Run migrations against dockerized postgres
   ```bash
   # Update DATABASE_URL in .env temporarily
   DATABASE_URL=postgresql://postgres:postgres@localhost:54321/whynot
   npm run migrate
   ```

**Acceptance Criteria**:

- [ ] postgres container starts successfully
- [ ] Can connect to postgres from host
- [ ] Migrations run without errors
- [ ] Data persists after container restart

---

### Task 1.2: Add Redis Service (45min)

**Goal**: Integrate Redis into docker-compose for future queue system.

**Files to Update**:

- `docker-compose.yml`

**Changes**:

```yaml
# Add to docker-compose.yml
services:
  postgres:
    # ... existing config

  redis:
    image: redis:7-alpine
    container_name: whynot-redis
    restart: always
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 3

volumes:
  postgres_data:
  redis_data:
```

**Steps**:

1. Update `docker-compose.yml` with redis service
2. Start redis container

   ```bash
   docker-compose up redis -d
   ```

3. Test redis connection
   ```bash
   docker exec -it whynot-redis redis-cli
   # In redis-cli:
   > PING
   # Should return: PONG
   > SET test "hello"
   > GET test
   # Should return: "hello"
   > exit
   ```

**Acceptance Criteria**:

- [ ] Redis container starts successfully
- [ ] Can connect to redis from host (port 6379)
- [ ] Health check passes
- [ ] Data persists after container restart (AOF enabled)

---

### Task 1.3: Install Redis Client in Backend (30min)

**Goal**: Add Redis npm package for future use.

**Files to Update**:

- `package.json`
- `src/config/redis.ts` (new file)

**Steps**:

1. Install redis client

   ```bash
   npm install redis
   npm install --save-dev @types/redis
   ```

2. Create Redis configuration file

**New file**: `src/config/redis.ts`

```typescript
import { createClient } from "redis";

let redisClient: ReturnType<typeof createClient> | null = null;

export async function getRedisClient() {
  if (redisClient) {
    return redisClient;
  }

  const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

  redisClient = createClient({
    url: redisUrl,
  });

  redisClient.on("error", (err) => {
    console.error("Redis Client Error", err);
  });

  redisClient.on("connect", () => {
    console.log("✅ Redis connected successfully");
  });

  await redisClient.connect();

  return redisClient;
}

export async function closeRedisClient() {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
}
```

3. Add REDIS_URL to `.env`

   ```bash
   # Add to .env
   REDIS_URL=redis://localhost:6379
   ```

4. Test Redis in backend (optional smoke test)

**New file**: `src/test-redis.ts` (temporary)

```typescript
import { getRedisClient } from "./config/redis";

async function testRedis() {
  const client = await getRedisClient();

  await client.set("test-key", "test-value");
  const value = await client.get("test-key");

  console.log("Redis test:", value); // Should print: test-value

  await client.del("test-key");
}

testRedis().catch(console.error);
```

Run test:

```bash
npm run build:server
node dist/test-redis.js
```

**Acceptance Criteria**:

- [ ] redis package installed
- [ ] Redis client connects successfully
- [ ] Can set/get values from backend code
- [ ] REDIS_URL environment variable configured

---

### Task 1.4: Update .env.example (15min)

**Goal**: Document new environment variables.

**Files to Update**:

- `.env.example`

**Changes**:

```bash
# Add to .env.example

# Redis Configuration
REDIS_URL=redis://localhost:6379
```

**Acceptance Criteria**:

- [ ] .env.example updated with Redis URL
- [ ] Documented in comments

---

### Task 1.5: Verify All Services Together (30min)

**Goal**: Ensure postgres + redis work together.

**Steps**:

1. Stop all containers

   ```bash
   docker-compose down
   ```

2. Start all services

   ```bash
   docker-compose up -d
   ```

3. Verify all containers running

   ```bash
   docker ps
   # Should see: whynot-postgres, whynot-redis
   ```

4. Check logs

   ```bash
   docker-compose logs postgres
   docker-compose logs redis
   ```

5. Test connections from backend (not in docker yet)

   ```bash
   # Database connection
   npm run migrate

   # Redis connection
   node dist/test-redis.js
   ```

**Acceptance Criteria**:

- [ ] Both containers start without errors
- [ ] Backend can connect to both postgres and redis
- [ ] No port conflicts
- [ ] Logs show healthy connections

---

## 📁 Files Changed

### Modified

- `docker-compose.yml` - Added redis service, volumes
- `.env` - Added REDIS_URL
- `.env.example` - Documented redis config
- `package.json` - Added redis dependency

### Created

- `src/config/redis.ts` - Redis client configuration
- `src/test-redis.ts` - Temporary test file (delete after phase)

---

## ✅ Phase Completion Checklist

- [ ] Task 1.1: Postgres audit complete
- [ ] Task 1.2: Redis service added to docker-compose
- [ ] Task 1.3: Redis client installed in backend
- [ ] Task 1.4: .env.example updated
- [ ] Task 1.5: All services verified together

**Deliverables**:

- [ ] Updated `docker-compose.yml` with redis
- [ ] Redis client configured in backend
- [ ] Documentation updated

---

## 🐛 Common Issues & Solutions

**Issue**: Redis container won't start

```bash
# Solution: Check port 6379 not already in use
lsof -i :6379
# If something running, stop it or change port in docker-compose
```

**Issue**: Cannot connect to redis from backend

```bash
# Solution: Check REDIS_URL format
echo $REDIS_URL
# Should be: redis://localhost:6379
```

**Issue**: Data not persisting in redis

```bash
# Solution: Verify volume is mounted
docker volume ls | grep redis
docker volume inspect whynot_redis_data
```

---

## 🎯 Next Phase

[Phase 2: Backend Dockerization](phase-2-backend-docker.md) - Create Dockerfile for backend service.
