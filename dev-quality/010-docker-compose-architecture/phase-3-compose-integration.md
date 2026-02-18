# Phase 3: Docker Compose Integration

**Duration**: 2 hours  
**Status**: ⬜ Not Started

---

## 🎯 Objective

Integrate the backend Docker image into docker-compose, configure networking between services, and enable one-command startup for the entire stack.

---

## 📋 Tasks

### Task 3.1: Update docker-compose.yml (45min)

**Goal**: Add backend service and configure dependencies.

**Files to Update**:

- `docker-compose.yml`

**Complete Configuration**:

```yaml
version: "3.8"

services:
  # ============================================
  # Backend Service
  # ============================================
  backend:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: whynot-backend
    restart: always
    ports:
      - "3000:3000"
    environment:
      # Service Discovery (docker network)
      - DATABASE_URL=postgresql://postgres:postgres@postgres:5432/whynot
      - REDIS_URL=redis://redis:6379
      - NODE_ENV=development
      - PORT=3000
      # External Services (from .env)
      - AGORA_APP_ID=${AGORA_APP_ID}
      - AGORA_CERTIFICATE=${AGORA_CERTIFICATE}
      - AGORA_CUSTOMER_ID=${AGORA_CUSTOMER_ID}
      - AGORA_CUSTOMER_SECRET=${AGORA_CUSTOMER_SECRET}
      - CLOUDFLARE_ACCOUNT_ID=${CLOUDFLARE_ACCOUNT_ID}
      - CLOUDFLARE_API_TOKEN=${CLOUDFLARE_API_TOKEN}
      - AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}
      - AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}
      - AWS_S3_BUCKET=${AWS_S3_BUCKET}
      - AWS_REGION=${AWS_REGION}
      - STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY}
      - STRIPE_WEBHOOK_SECRET=${STRIPE_WEBHOOK_SECRET}
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - whynot-network
    healthcheck:
      test:
        [
          "CMD",
          "wget",
          "--quiet",
          "--tries=1",
          "--spider",
          "http://localhost:3000/health",
        ]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  # ============================================
  # PostgreSQL Database
  # ============================================
  postgres:
    image: postgres:16-alpine
    container_name: whynot-postgres
    restart: always
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: whynot
    ports:
      - "54321:5432" # External port 54321 to avoid conflicts
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - whynot-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  # ============================================
  # Redis Cache & Queue
  # ============================================
  redis:
    image: redis:7-alpine
    container_name: whynot-redis
    restart: always
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes
    networks:
      - whynot-network
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 3

# ============================================
# Volumes
# ============================================
volumes:
  postgres_data:
    driver: local
  redis_data:
    driver: local

# ============================================
# Networks
# ============================================
networks:
  whynot-network:
    driver: bridge
```

**Key Changes**:

1. Added `backend` service with build config
2. Added health checks to all services
3. Created dedicated network `whynot-network`
4. Configured service dependencies
5. Environment variables from `.env` file

**Steps**:

1. Backup existing docker-compose.yml

   ```bash
   cp docker-compose.yml docker-compose.yml.backup
   ```

2. Replace with new configuration

3. Validate YAML syntax
   ```bash
   docker-compose config
   # Should output the parsed config without errors
   ```

**Acceptance Criteria**:

- [ ] docker-compose.yml updated
- [ ] All services defined
- [ ] Health checks configured
- [ ] Network created
- [ ] YAML validates without errors

---

### Task 3.2: Test Full Stack Startup (30min)

**Goal**: Verify all services start together and connect properly.

**Steps**:

1. Stop any running containers

   ```bash
   docker-compose down -v  # -v removes volumes (fresh start)
   ```

2. Build and start all services

   ```bash
   docker-compose up --build
   ```

   Expected output:

   ```
   Building backend...
   [+] Building 120.5s (16/16) FINISHED
   Creating whynot-postgres ... done
   Creating whynot-redis    ... done
   Creating whynot-backend  ... done

   whynot-postgres | database system is ready to accept connections
   whynot-redis    | Ready to accept connections
   whynot-backend  | Database connected successfully
   whynot-backend  | Redis connected successfully
   whynot-backend  | Server running on http://localhost:3000
   ```

3. Check all containers running

   ```bash
   docker-compose ps
   ```

   Expected:

   ```
   NAME              STATUS
   whynot-postgres   Up (healthy)
   whynot-redis      Up (healthy)
   whynot-backend    Up (healthy)
   ```

4. Test health checks

   ```bash
   # Backend health
   curl http://localhost:3000/health

   # Postgres health
   docker-compose exec postgres pg_isready -U postgres

   # Redis health
   docker-compose exec redis redis-cli ping
   ```

5. Test frontend access
   ```bash
   # Open browser
   open http://localhost:3000
   # Should show WhyNot frontend
   ```

**Acceptance Criteria**:

- [ ] All containers start without errors
- [ ] All health checks pass
- [ ] Backend accessible at :3000
- [ ] Frontend loads correctly
- [ ] No connection errors in logs

---

### Task 3.3: Run Database Migrations (15min)

**Goal**: Execute migrations inside the backend container.

**Steps**:

1. Run migrations

   ```bash
   docker-compose exec backend npm run migrate
   ```

   Expected output:

   ```
   Running migrations...
   ✅ Migration 000_create_users.ts applied
   ✅ Migration 001_create_channels.ts applied
   ...
   ✅ All migrations completed
   ```

2. Verify tables created

   ```bash
   docker-compose exec postgres psql -U postgres -d whynot -c "\dt"
   ```

   Should list all tables: users, channels, shops, etc.

**Alternative**: Create migration script

**New file**: `scripts/docker-migrate.sh`

```bash
#!/bin/bash
set -e

echo "🔄 Running database migrations..."
docker-compose exec backend npm run migrate
echo "✅ Migrations completed"
```

Make executable:

```bash
chmod +x scripts/docker-migrate.sh
```

Usage:

```bash
./scripts/docker-migrate.sh
```

**Acceptance Criteria**:

- [ ] Migrations run successfully
- [ ] All tables created
- [ ] No migration errors
- [ ] Script works from host machine

---

### Task 3.4: Create Docker Helper Scripts (30min)

**Goal**: Simplify common Docker operations.

**New file**: `scripts/docker-dev.sh`

```bash
#!/bin/bash
set -e

echo "🚀 Starting WhyNot development environment..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
  echo "❌ Docker is not running. Please start Docker Desktop."
  exit 1
fi

# Build and start services
docker-compose up --build

# Cleanup on exit
trap 'docker-compose down' EXIT
```

**New file**: `scripts/docker-clean.sh`

```bash
#!/bin/bash
set -e

echo "🧹 Cleaning Docker resources..."

# Stop and remove containers
docker-compose down

# Optionally remove volumes (uncomment if needed)
# docker-compose down -v

# Remove dangling images
docker image prune -f

echo "✅ Cleanup completed"
```

**New file**: `scripts/docker-logs.sh`

```bash
#!/bin/bash

# Show logs for specific service or all
SERVICE=${1:-}

if [ -z "$SERVICE" ]; then
  echo "📜 Showing logs for all services..."
  docker-compose logs -f
else
  echo "📜 Showing logs for $SERVICE..."
  docker-compose logs -f $SERVICE
fi
```

**New file**: `scripts/docker-shell.sh`

```bash
#!/bin/bash

SERVICE=${1:-backend}

echo "🐚 Opening shell in $SERVICE container..."
docker-compose exec $SERVICE sh
```

**Make all executable**:

```bash
chmod +x scripts/docker-*.sh
```

**Usage examples**:

```bash
./scripts/docker-dev.sh              # Start all services
./scripts/docker-migrate.sh          # Run migrations
./scripts/docker-logs.sh backend     # View backend logs
./scripts/docker-shell.sh postgres   # Open postgres shell
./scripts/docker-clean.sh            # Stop and cleanup
```

**Acceptance Criteria**:

- [ ] All scripts created
- [ ] Scripts are executable
- [ ] Scripts work as expected
- [ ] Error handling included

---

### Task 3.5: Test Service Communication (30min)

**Goal**: Verify backend can communicate with postgres and redis.

**Steps**:

1. Check backend logs for connections

   ```bash
   docker-compose logs backend | grep -i "connected"
   ```

   Should show:

   ```
   ✅ Database connected successfully
   ✅ Redis connected successfully
   ```

2. Test database queries from backend

   ```bash
   docker-compose exec backend node -e "
   const db = require('./dist/db').db;
   db.selectFrom('users').selectAll().execute().then(console.log);
   "
   ```

3. Test Redis operations

   ```bash
   docker-compose exec backend node -e "
   const { getRedisClient } = require('./dist/config/redis');
   getRedisClient().then(client => {
     client.set('test', 'docker-compose').then(() => {
       client.get('test').then(console.log);
     });
   });
   "
   ```

4. Test DNS resolution

   ```bash
   # From inside backend container
   docker-compose exec backend ping -c 2 postgres
   docker-compose exec backend ping -c 2 redis

   # Should resolve to internal IPs (172.x.x.x)
   ```

**Acceptance Criteria**:

- [ ] Backend connects to postgres
- [ ] Backend connects to redis
- [ ] Queries work correctly
- [ ] Service DNS resolution works

---

## 📁 Files Changed

### Modified

- `docker-compose.yml` - Complete 3-service orchestration

### Created

- `scripts/docker-dev.sh` - Start development environment
- `scripts/docker-migrate.sh` - Run migrations
- `scripts/docker-logs.sh` - View logs
- `scripts/docker-shell.sh` - Open container shell
- `scripts/docker-clean.sh` - Cleanup resources

### Backup

- `docker-compose.yml.backup` - Original config

---

## ✅ Phase Completion Checklist

- [ ] Task 3.1: docker-compose.yml updated
- [ ] Task 3.2: Full stack starts successfully
- [ ] Task 3.3: Migrations work in container
- [ ] Task 3.4: Helper scripts created
- [ ] Task 3.5: Service communication verified

**Deliverables**:

- [ ] Complete docker-compose configuration
- [ ] Helper scripts for common operations
- [ ] Working multi-service stack

---

## 🐛 Common Issues & Solutions

**Issue**: "ERROR: The Compose file is invalid"

```bash
# Solution: Validate YAML
docker-compose config
# Fix indentation/syntax errors
```

**Issue**: "Connection refused" from backend

```bash
# Solution: Check service names match environment variables
# DATABASE_URL should use service name 'postgres', not 'localhost'
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/whynot
```

**Issue**: "Ports are not available"

```bash
# Solution: Check if ports already in use
lsof -i :3000
lsof -i :54321
lsof -i :6379
# Kill conflicting processes or change ports
```

**Issue**: "Backend container exits immediately"

```bash
# Solution: Check logs for errors
docker-compose logs backend
# Common: missing env vars, database connection failed
```

**Issue**: "Health check failing"

```bash
# Solution: Increase start_period
healthcheck:
  start_period: 60s  # Give more time for services to start
```

---

## 🎯 Next Phase

[Phase 4: Render Deployment Setup](phase-4-render-deployment.md) - Create render.yaml and deploy to production.
