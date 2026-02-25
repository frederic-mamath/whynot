# Docker Development Guide

## Overview

WhyNot runs on Docker Compose with three services:

- **backend**: Express + tRPC API serving React frontend
- **postgres**: PostgreSQL database (port 54321)
- **redis**: Redis cache & job queue (port 6379)

---

## Quick Start

### Prerequisites

- Docker Desktop installed
- Node.js 20+ (for local type checking)

### First-time Setup

```bash
# 1. Clone repository
git clone <repo-url>
cd whynot

# 2. Copy environment file
cp .env.example .env

# 3. Edit .env with your credentials
# Required:
#   - AGORA_APP_ID, AGORA_APP_CERTIFICATE
#   - CLOUDFLARE_STREAM_ACCOUNT_ID, CLOUDFLARE_STREAM_API_TOKEN
#   - STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET

# 4. Start all services
./scripts/docker-dev.sh

# 5. Migrations run automatically on startup!
# Watch logs for: "✅ All migrations completed"

# 6. Open app
open http://localhost:3000
```

---

## Helper Scripts

Located in `scripts/`:

| Script                        | Purpose                 |
| ----------------------------- | ----------------------- |
| `docker-dev.sh`               | Start all services      |
| `docker-stop.sh`              | Stop all services       |
| `docker-logs.sh [service]`    | View logs               |
| `docker-migrate.sh`           | Run database migrations |
| `docker-shell.sh [service]`   | Open shell in container |
| `docker-clean.sh [--volumes]` | Clean and restart       |

### Usage

```bash
# Start development
./scripts/docker-dev.sh

# View backend logs
./scripts/docker-logs.sh backend

# View all logs
./scripts/docker-logs.sh

# Run migrations manually (usually not needed)
./scripts/docker-migrate.sh

# Open backend shell
./scripts/docker-shell.sh backend

# Full reset (DELETES ALL DATA!)
./scripts/docker-clean.sh --volumes
```

---

## Development Workflow

### Standard Development

```bash
# Terminal 1: Start services (with logs)
docker-compose up

# Or start in background
./scripts/docker-dev.sh

# Terminal 2: Watch logs
./scripts/docker-logs.sh backend

# Terminal 3: Run commands as needed
./scripts/docker-migrate.sh
```

### Database Migrations

**Automatic on startup**: Migrations run automatically when the backend container starts.

**Manual execution** (if needed):

```bash
# Using helper script
./scripts/docker-migrate.sh

# Or directly
docker-compose exec backend npm run migrate
```

**Creating new migrations**:

```bash
# Create migration file
npm run db:generate

# Migration will run automatically on next container start
# Or run manually with ./scripts/docker-migrate.sh
```

### Accessing Services

```bash
# Backend shell
docker-compose exec backend sh
./scripts/docker-shell.sh backend

# PostgreSQL shell
docker-compose exec postgres psql -U postgres whynot
./scripts/docker-shell.sh postgres

# Redis CLI
docker-compose exec redis redis-cli
./scripts/docker-shell.sh redis
```

---

## Troubleshooting

### Port Conflicts

**Error**: `Bind for 0.0.0.0:54321 failed: port is already allocated`

**Solution**:

```bash
# Find process using port
lsof -i :54321

# Kill process
kill -9 <PID>

# Or change port in docker-compose.yml
ports:
  - "54322:5432"  # Use different host port
```

---

### Database Connection Failed

**Error**: `Error: connect ECONNREFUSED 127.0.0.1:54321`

**Solution**:

```bash
# 1. Check postgres is running
docker-compose ps

# 2. Check if postgres is healthy
docker-compose exec postgres pg_isready

# 3. Verify connection from backend
docker-compose exec backend sh -c 'nc -zv postgres 5432'

# 4. Check environment variables
docker-compose exec backend env | grep DB_
```

**Common mistakes**:

- Using `localhost` instead of `postgres` as DB_HOST in docker-compose
- Database not ready when backend starts (wait ~10s)
- Wrong port: Should be `54321` from host, `5432` inside containers

---

### Redis Connection Failed

**Error**: `Error: Redis connection to localhost:6379 failed`

**Solution**:

```bash
# Check redis is running
docker-compose ps redis

# Test connection
docker-compose exec redis redis-cli ping
# Should return: PONG

# Check from backend
docker-compose exec backend sh -c 'nc -zv redis 6379'

# Verify REDIS_URL
docker-compose exec backend env | grep REDIS_URL
# Should be: redis://redis:6379
```

---

### Backend Won't Start

**Error**: Container exits immediately

**Debug steps**:

```bash
# 1. Check logs
./scripts/docker-logs.sh backend

# 2. Common causes and fixes:
# Missing dependencies
docker-compose exec backend npm install

# TypeScript errors
docker-compose exec backend npm run type-check

# Port 3000 in use
lsof -i :3000 && kill -9 <PID>

# Database not ready
# Wait 10s after docker-compose up, or check postgres health
docker-compose exec postgres pg_isready
```

---

### Migrations Fail

**Error**: `relation "users" does not exist` or migration errors

**Solution**:

```bash
# 1. Check database is empty/fresh
docker-compose exec postgres psql -U postgres whynot -c '\dt'

# 2. Drop and recreate database (DELETES ALL DATA!)
docker-compose down -v
docker-compose up -d

# 3. Migrations run automatically on startup
# Watch logs: ./scripts/docker-logs.sh backend
# Look for: "✅ All migrations completed"

# 4. If migrations still fail, run manually
./scripts/docker-migrate.sh
```

---

### Code Changes Not Reflected

**Issue**: Modified code doesn't appear in running container

**Cause**: Not using volumes (production build)

**Solution**:

```bash
# Rebuild image
docker-compose build --no-cache backend

# Restart container
docker-compose up -d backend

# Or full restart
./scripts/docker-dev.sh
```

**Note**: For hot reload, you'd need to mount source code as volumes (not implemented yet).

---

### "Permission Denied" Errors

**Issue**: Can't write to `node_modules` or `dist/`

**Solution** (macOS/Linux):

```bash
# Fix ownership
sudo chown -R $USER:$USER node_modules dist

# Or rebuild with correct user
docker-compose build --no-cache backend
```

---

### Container Keeps Restarting

**Check health status**:

```bash
docker-compose ps

# If unhealthy, check health endpoint
curl http://localhost:3000/health

# View container logs
./scripts/docker-logs.sh backend
```

---

## Production Differences

| Aspect     | Development (Docker Compose) | Production (Render)         |
| ---------- | ---------------------------- | --------------------------- |
| Host       | localhost:3000               | whynot-backend.onrender.com |
| Database   | Docker postgres (port 54321) | Render PostgreSQL           |
| Redis      | Docker redis (port 6379)     | Upstash Redis               |
| Build      | Multi-stage Dockerfile       | Same Dockerfile             |
| Logs       | `docker-compose logs`        | Render dashboard            |
| Migrations | Auto on startup              | Auto on startup             |
| Secrets    | `.env` file                  | Render environment vars     |

---

## Advanced

### Custom Docker Commands

```bash
# Run any npm script
docker-compose exec backend npm run <script>

# TypeScript check
docker-compose exec backend npm run type-check

# Database query
docker-compose exec postgres psql -U postgres whynot -c "SELECT * FROM users;"

# Redis commands
docker-compose exec redis redis-cli INFO
docker-compose exec redis redis-cli KEYS '*'

# View service logs (follow mode)
docker-compose logs -f backend
docker-compose logs -f postgres
docker-compose logs -f redis

# Restart single service
docker-compose restart backend

# Rebuild and restart
docker-compose up -d --build backend
```

---

### Debugging

**Enable debug mode**:

```bash
# Edit .env
DEBUG=*

# Restart backend
docker-compose restart backend

# View verbose logs
./scripts/docker-logs.sh backend
```

**Interactive debugging** (not currently set up):

```bash
# Would require exposing debug port in docker-compose.yml
# ports:
#   - "9229:9229"  # Node.js inspector
```

---

### Health Checks

```bash
# Backend health
curl http://localhost:3000/health
# Expected: {"status":"healthy","timestamp":"...","uptime":123.45,"environment":"development"}

# PostgreSQL health
docker-compose exec postgres pg_isready
# Expected: /var/run/postgresql:5432 - accepting connections

# Redis health
docker-compose exec redis redis-cli ping
# Expected: PONG

# All services status
docker-compose ps
# All should show "Up" and "healthy"
```

---

### Database Management

**Backup database**:

```bash
docker-compose exec postgres pg_dump -U postgres whynot > backup.sql
```

**Restore database**:

```bash
cat backup.sql | docker-compose exec -T postgres psql -U postgres whynot
```

**Reset database** (DELETES ALL DATA!):

```bash
./scripts/docker-clean.sh --volumes
```

---

### Performance Monitoring

```bash
# Container stats (CPU, Memory, Network)
docker stats

# Service-specific stats
docker stats whynot-backend whynot-postgres whynot-redis

# Disk usage
docker system df

# Clean up unused images/containers
docker system prune -a
```

---

## Architecture

```
┌─────────────────────────────────────────────────┐
│  Host Machine (macOS/Linux/Windows)            │
│                                                 │
│  ┌───────────────────────────────────────────┐ │
│  │  Docker Network: whynot-network           │ │
│  │                                           │ │
│  │  ┌─────────────┐  ┌──────────────┐       │ │
│  │  │   Backend   │  │  PostgreSQL  │       │ │
│  │  │  Node 20    │──│   port 5432  │       │ │
│  │  │  port 3000  │  └──────────────┘       │ │
│  │  └──────┬──────┘         │               │ │
│  │         │                │               │ │
│  │         │      ┌─────────────┐           │ │
│  │         └──────│    Redis    │           │ │
│  │                │  port 6379  │           │ │
│  │                └─────────────┘           │ │
│  └───────────────────────────────────────────┘ │
│         │              │              │        │
│    localhost:3000  localhost:54321  localhost:6379
└─────────────────────────────────────────────────┘
```

**Key Points**:

- All services on dedicated network `whynot-network`
- Backend connects to `postgres:5432` and `redis:6379` (internal DNS)
- Host connects to `localhost:54321` (postgres) and `localhost:6379` (redis)
- Frontend bundled into backend container, served from `/dist/public`

---

## Environment Variables

**Development** (docker-compose.yml):

- `DB_HOST=postgres` (container name)
- `DB_PORT=5432` (internal port)
- `REDIS_URL=redis://redis:6379` (container name)

**Host access** (from macOS/Linux terminal):

- PostgreSQL: `postgresql://postgres:postgres@localhost:54321/whynot`
- Redis: `redis://localhost:6379`

---

## Next Steps

- **Production deployment**: See [RENDER_DEPLOYMENT.md](RENDER_DEPLOYMENT.md)
- **Project overview**: See [README.md](README.md)
- **Architecture details**: See [ARCHITECTURE.md](ARCHITECTURE.md)

---

## FAQ

**Q: Why port 54321 for PostgreSQL instead of 5432?**  
A: To avoid conflicts with locally-installed PostgreSQL instances.

**Q: Do I need Node.js installed locally?**  
A: Only for IDE type checking. All runtime execution happens in Docker.

**Q: How do I add new npm packages?**  
A: Add to `package.json`, then rebuild: `docker-compose build backend`

**Q: Can I use hot reload?**  
A: Not currently. Requires mounting source code as volumes (future enhancement).

**Q: Where are database files stored?**  
A: In Docker volume `whynot_postgres_data`. Persists between restarts.

**Q: How do I completely reset everything?**  
A: `./scripts/docker-clean.sh --volumes` (DELETES ALL DATA!)

---

**Happy coding! 🐳**
