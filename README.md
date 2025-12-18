# NoWhat - tRPC Authentication Project

A tRPC-based authentication system with PostgreSQL, Drizzle ORM, and JWT authentication.

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

The server will start on `http://localhost:3000`.

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
  };
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
  };
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
DATABASE_URL=postgres://postgres:postgres@localhost:5432/notwhat
JWT_SECRET=your-secret-key-change-in-production
PORT=3000
```

## Project Structure

```
notwhat/
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
