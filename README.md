# WhyNot - Live Streaming Platform

A tRPC-based live streaming platform with PostgreSQL, real-time video channels, shops, and product promotions.

## Features

- 🚀 tRPC for type-safe API
- 🐘 PostgreSQL database with Docker
- 🔐 JWT-based authentication
- 📧 Email/password authentication
- 🗄️ Drizzle ORM with migration support
- 🔄 Database versioning

## Prerequisites

- Node.js 18+
- Docker and Docker Compose
- npm or yarn

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Start PostgreSQL Database

```bash
docker-compose up -d
```

This will start a PostgreSQL database on `localhost:5432`.

### 3. Generate and Run Migrations

```bash
# Generate migration files from schema
npm run db:generate

# Push schema to database (for development)
npm run db:push
```

### 4. Start Development Server

```bash
npm run dev
```

The server will run on `http://localhost:3000` and serve both the API and the React frontend.

## API Endpoints

### tRPC Endpoint

- Base URL: `http://localhost:3000/trpc`

### Available Procedures

#### `auth.register`

Register a new user.

**Input:**

```typescript
{
  email: string;
  password: string; // min 6 characters
}
```

**Output:**

```typescript
{
  user: {
    id: number;
    email: string;
    isVerified: boolean;
  }
  token: string;
}
```

#### `auth.login`

Login with email and password.

**Input:**

```typescript
{
  email: string;
  password: string;
}
```

**Output:**

```typescript
{
  user: {
    id: number;
    email: string;
    isVerified: boolean;
  }
  token: string;
}
```

#### `auth.me`

Get current authenticated user (requires Bearer token).

**Output:**

```typescript
{
  id: number;
  email: string;
  isVerified: boolean;
  createdAt: Date;
}
```

## Database Commands

```bash
# Generate migration files
npm run db:generate

# Push schema to database (development)
npm run db:push

# Run migrations
npm run db:migrate

# Open Drizzle Studio (database GUI)
npm run db:studio
```

## Environment Variables

Copy `.env.example` to `.env` and update:

```env
DATABASE_URL=postgres://postgres:postgres@localhost:5432/whynot
JWT_SECRET=your-secret-key-change-in-production
PORT=3000
```

## Project Structure

```
whynot/
├── src/
│   ├── db/
│   │   ├── index.ts       # Database connection
│   │   └── schema.ts      # Drizzle schema definitions
│   ├── routers/
│   │   ├── auth.ts        # Auth router
│   │   └── index.ts       # Root router
│   ├── types/
│   │   └── context.ts     # tRPC context types
│   ├── utils/
│   │   └── auth.ts        # Auth utilities (JWT, bcrypt)
│   ├── index.ts           # Express server
│   └── trpc.ts            # tRPC initialization
├── drizzle/               # Migration files (generated)
├── docker-compose.yml     # PostgreSQL Docker config
├── drizzle.config.ts      # Drizzle configuration
└── tsconfig.json          # TypeScript configuration
```

## Testing with cURL

### Register

```bash
curl -X POST http://localhost:3000/trpc/auth.register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### Login

```bash
curl -X POST http://localhost:3000/trpc/auth.login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### Get Current User

```bash
curl http://localhost:3000/trpc/auth.me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## License

ISC

## Frontend Development

### Start Frontend Development Server

```bash
# In a separate terminal
npm run dev:client
```

The frontend will be available at `http://localhost:5173`.

### Pages

- **Landing** (`/`) - Homepage with call-to-action buttons
- **Login** (`/login`) - User login form
- **Register** (`/register`) - User registration form
- **Dashboard** (`/dashboard`) - Protected user profile page

### Full Development Setup

```bash
# Terminal 1 - Start PostgreSQL
docker-compose up

# Terminal 2 - Start Backend API
npm run dev

# Terminal 3 - Start Frontend
npm run dev:client
```

Then visit `http://localhost:5173` to see the application.

---

## 🐳 Docker & Deployment

WhyNot now supports Docker Compose for local development and Render.com for production deployment.

### Quick Start with Docker

```bash
# Start all services (backend, postgres, redis)
./scripts/docker-dev.sh

# Run migrations
./scripts/docker-migrate.sh

# View logs
./scripts/docker-logs.sh

# Stop all services
./scripts/docker-stop.sh
```

### Deployment Guides

- **[Render Deployment Guide](RENDER_DEPLOYMENT.md)** - Complete guide for deploying to Render.com
- **[Environment Variables Checklist](RENDER_ENV_CHECKLIST.md)** - All required environment variables

### Key Files

- `docker-compose.yml` - Local development orchestration
- `Dockerfile` - Multi-stage backend container build
- `render.yaml` - Render.com infrastructure as code
- `scripts/` - Docker helper scripts
