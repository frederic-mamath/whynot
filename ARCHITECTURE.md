# WhyNot - Architecture & Design Patterns

## Overview

WhyNot is a full-stack authentication application using a type-safe API architecture with clear separation between frontend and backend concerns.

**Frontend Architecture**: See [client/ARCHITECTURE.md](client/ARCHITECTURE.md) for UI and component structure.

**Styling Guide**: See [STYLING.md](STYLING.md) for design system and Tailwind CSS patterns.

## Tech Stack

### Backend

- **Node.js + TypeScript** - Runtime and type safety
- **Express.js** - HTTP server framework
- **tRPC** - End-to-end type-safe API layer
- **Drizzle ORM** - Type-safe SQL query builder
- **PostgreSQL** - Relational database
- **Docker** - Database containerization

### Frontend

- **React 18** - UI library (see [client/ARCHITECTURE.md](client/ARCHITECTURE.md))
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling (see [STYLING.md](STYLING.md))
- **Shadcn UI** - Component library
- **React Router** - Client-side routing
- **TanStack Query** - Server state management
- **tRPC React Client** - Type-safe API consumption

---

## Frontend Page Architecture

### Page Naming Convention

All page components follow the **`<Entity><Action>Page`** pattern for consistency, predictability, and scalability.

#### Pattern: `<Entity><Action>Page.tsx`

- **Entity**: Singular noun representing the resource (Channel, Shop, Product, User)
- **Action**: One of four CRUD-aligned actions:
  - **`List`** - Display multiple items (browse/search view)
  - **`Details`** - Display single item (read-only detail view)
  - **`Create`** - Form to create a new item
  - **`Update`** - Form to edit an existing item

#### Page Types by Entity

**Channel Pages**:
- `ChannelListPage.tsx` - Browse all available channels
- `ChannelDetailsPage.tsx` - View/join a specific channel (live video stream)
- `ChannelCreatePage.tsx` - Create a new channel

**Shop Pages**:
- `ShopListPage.tsx` - Browse all shops
- `ShopDetailsPage.tsx` - View shop info and products
- `ShopCreatePage.tsx` - Create a new shop

**Product Pages**:
- `ProductListPage.tsx` - List products within a shop
- `ProductDetailsPage.tsx` - View single product details _(future)_
- `ProductCreatePage.tsx` - Create a new product
- `ProductUpdatePage.tsx` - Edit an existing product

**User Pages**:
- `LoginPage.tsx` - User authentication
- `RegisterPage.tsx` - User registration
- `DashboardPage.tsx` - User dashboard/home

**Other Pages**:
- `LandingPage.tsx` - Marketing/landing page

#### File Organization

```
client/src/pages/
├── ChannelListPage.tsx       # List all channels
├── ChannelDetailsPage.tsx    # View/join channel (video stream)
├── ChannelCreatePage.tsx     # Create channel form
├── ShopListPage.tsx          # List all shops
├── ShopDetailsPage.tsx       # Shop overview + products
├── ShopCreatePage.tsx        # Create shop form
├── ProductListPage.tsx       # Products in a shop
├── ProductCreatePage.tsx     # Create product form
├── ProductUpdatePage.tsx     # Edit product form
├── DashboardPage.tsx         # User dashboard
├── LoginPage.tsx             # Login form
├── RegisterPage.tsx          # Registration form
├── LandingPage.tsx           # Home/marketing page
└── ShopLayout.tsx            # Layout wrapper (not a page)
```

#### Route Mapping

Routes follow RESTful conventions:

| Page | Route | Description |
|------|-------|-------------|
| `ChannelListPage` | `/channels` | List all channels |
| `ChannelDetailsPage` | `/channel/:id` | View specific channel |
| `ChannelCreatePage` | `/create-channel` | Create new channel |
| `ShopListPage` | `/shops` | List all shops |
| `ShopDetailsPage` | `/shop/:id` | View specific shop |
| `ShopCreatePage` | `/shop/create` | Create new shop |
| `ProductListPage` | `/shops/:id/products` | Products in shop |
| `ProductCreatePage` | `/shops/:id/products/create` | Create product |
| `ProductUpdatePage` | `/shops/:shopId/products/:id/edit` | Edit product |

#### Benefits

1. **Predictable** - Know exactly where to find entity-related pages
2. **Scalable** - Easy to add new entities (e.g., `OrderListPage`, `OrderDetailsPage`)
3. **IDE-friendly** - Autocomplete shows all related pages when typing entity name
4. **Consistent** - Same pattern across entire codebase
5. **Industry-standard** - Aligns with Next.js App Router and modern React conventions
6. **Self-documenting** - File name describes purpose without opening the file

---

## Architecture Patterns

### 1. **API Layer - tRPC (Type-Safe RPC)**

**Pattern**: Remote Procedure Call (RPC) with full TypeScript inference

**Location**: `src/trpc.ts`, `src/routers/`

**How it works**:

- tRPC provides end-to-end type safety between client and server
- No code generation needed - types flow automatically from server to client
- Procedures are defined on the server and consumed type-safely on the client

**Example**:

```typescript
// Server (src/routers/auth.ts)
export const authRouter = router({
  register: publicProcedure
    .input(z.object({ email: z.string().email(), password: z.string().min(6) }))
    .mutation(async ({ input }) => {
      /* ... */
    }),
});

// Client (client/src/pages/Register.tsx)
const registerMutation = trpc.auth.register.useMutation({
  onSuccess: (data) => {
    /* data is fully typed! */
  },
});
```

**Benefits**:

- Full type safety from database to UI
- Automatic API contract validation
- No REST boilerplate (no controllers, routes, DTOs)
- Reduced bugs through compile-time checks

---

### 2. **Data Layer - Repository Pattern with Drizzle ORM**

**Pattern**: Repository Pattern + Query Builder

**Location**: `src/db/`

**Structure**:

```
src/db/
├── schema.ts    # Database schema definitions (single source of truth)
├── index.ts     # Database connection and Drizzle instance
```

**How it works**:

- **Schema-first approach**: Define tables in TypeScript
- **Type inference**: TypeScript types derived from schema
- **Migration support**: Version-controlled SQL migrations
- **Type-safe queries**: SQL queries with full TypeScript support

**Example**:

```typescript
// Define schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  // ...
});

// Infer types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

// Query with type safety
const user = await db.query.users.findFirst({
  where: eq(users.email, input.email),
});
```

**Benefits**:

- Single source of truth for data structure
- Type-safe database operations
- Easy schema evolution with migrations
- No runtime overhead

---

### 3. **Authentication - JWT Token-Based Authentication**

**Pattern**: Stateless JWT Authentication with Bearer tokens

**Location**: `src/utils/auth.ts`, `src/index.ts` (context creation)

**Flow**:

1. User registers/logs in → Server validates credentials
2. Server generates JWT token with user ID
3. Client stores token in localStorage
4. Client sends token in Authorization header: `Bearer <token>`
5. Server validates token and extracts user ID into context

**Security Features**:

- Password hashing with bcrypt (10 rounds)
- JWT expiration (7 days)
- Token verification on protected routes
- Context-based authorization

**Example**:

```typescript
// Token generation
export function generateToken(userId: number): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "7d" });
}

// Context creation (runs on every request)
const createContext = ({ req }: CreateExpressContextOptions): Context => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (token) {
    const payload = verifyToken(token);
    if (payload) return { userId: payload.userId };
  }
  return {};
};
```

---

### 4. **Frontend - Component-Based Architecture**

**See [client/ARCHITECTURE.md](client/ARCHITECTURE.md) for complete frontend architecture and component structure.**

**Pattern**: Functional Components + Hooks + Client-Side Routing

**Key Patterns**:

#### a) **Provider Pattern** (Composition Root)

```typescript
// App.tsx - wraps entire app with necessary providers
<trpc.Provider client={trpcClient} queryClient={queryClient}>
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <Routes>...</Routes>
    </BrowserRouter>
  </QueryClientProvider>
</trpc.Provider>
```

#### b) **Hooks Pattern** (State & Side Effects)

- `useState` - Local component state
- `useNavigate` - Programmatic navigation
- `useEffect` - Side effects (auth checks, redirects)
- `trpc.*.useMutation` - Server mutations (register, login)
- `trpc.*.useQuery` - Server data fetching (user profile)

#### c) **Controlled Components** (Form Handling)

```typescript
const [email, setEmail] = useState('');
<input value={email} onChange={(e) => setEmail(e.target.value)} />
```

---

### 5. **State Management Strategy**

**Pattern**: Local State + Server State Separation

**Server State** (via TanStack Query):

- Managed by React Query through tRPC hooks
- Automatic caching, refetching, and invalidation
- Used for: user data, API responses

**Local State** (via useState):

- Managed by React's useState hook
- Used for: form inputs, UI toggles, temporary data

**Persistent State** (via localStorage):

- JWT token storage
- Survives page refreshes

**No Global State Library Needed**:

- Server state handled by React Query
- Authentication state derived from token presence
- UI state kept local to components

---

### 6. **Routing Architecture**

**Pattern**: Client-Side Routing with React Router

**Routes**:

- `/` - Landing page (public)
- `/login` - Login page (public, redirects if authenticated)
- `/register` - Registration page (public, redirects if authenticated)
- `/dashboard` - User dashboard (protected, redirects if not authenticated)

**Protection Strategy**:

```typescript
// Route protection via useEffect in components
useEffect(() => {
  if (!isAuthenticated()) {
    navigate("/login");
  }
}, [navigate]);
```

**Better Alternative** (not yet implemented):

- Protected Route wrapper component
- Declarative route protection

---

### 7. **Error Handling Pattern**

**Backend**:

```typescript
// tRPC error handling with typed error codes
throw new TRPCError({
  code: "UNAUTHORIZED", // Typed error codes
  message: "Invalid credentials",
});

// Global error handler in Express middleware
onError: ({ path, error }) => {
  console.error(`ERROR [${path}]:`, error.message);
};
```

**Frontend**:

```typescript
// Error handling in mutations
const mutation = trpc.auth.login.useMutation({
  onSuccess: (data) => {
    /* handle success */
  },
  onError: (err) => setError(err.message), // err is typed!
});
```

---

### 8. **Middleware Pattern**

**Backend Middleware Chain**:

```
Request → CORS → JSON Parser → Logger → tRPC Handler → Response
```

**Custom Middleware**:

- `logger` - Request logging with timestamps
- `createContext` - Auth token validation and context injection
- `onError` - Error logging and handling

---

## Design Principles Applied

### 1. **Separation of Concerns**

- **Backend**: Business logic separated into routers
- **Frontend**: UI separated into pages/components
- **Data**: Schema definitions isolated in db/schema.ts

### 2. **Single Responsibility**

- Each router handles one domain (auth)
- Each page handles one route
- Utilities focused on single tasks (auth, logging)

### 3. **DRY (Don't Repeat Yourself)**

- Shared types generated from schema
- Reusable auth utilities
- Centralized tRPC client configuration

### 4. **Type Safety First**

- TypeScript strict mode enabled
- End-to-end type inference with tRPC
- Schema-driven type generation with Drizzle

### 5. **Convention over Configuration**

- Standard project structure
- Consistent naming conventions
- Minimal boilerplate

---

## Data Flow Examples

### Registration Flow

```
User Input (Register.tsx)
    ↓
Form Validation (client-side)
    ↓
trpc.auth.register.useMutation()
    ↓
HTTP POST /trpc/auth.register
    ↓
Express Middleware (CORS, JSON, Logger)
    ↓
tRPC createContext (empty for register)
    ↓
authRouter.register procedure
    ↓
Input validation (Zod schema)
    ↓
Check existing user (Drizzle query)
    ↓
Hash password (bcrypt)
    ↓
Insert user (Drizzle insert)
    ↓
Generate JWT token
    ↓
Return { user, token }
    ↓
onSuccess callback
    ↓
Store token in localStorage
    ↓
Navigate to /dashboard
```

### Protected Resource Access Flow

```
Component Mount (Dashboard.tsx)
    ↓
trpc.auth.me.useQuery()
    ↓
HTTP GET /trpc/auth.me
    ↓
Express Middleware (Logger)
    ↓
tRPC createContext
    ↓
Extract Bearer token from headers
    ↓
Verify JWT token
    ↓
Set userId in context
    ↓
authRouter.me procedure
    ↓
Check context.userId (throw if missing)
    ↓
Query user from database
    ↓
Return user data
    ↓
React Query caches result
    ↓
Component renders with data
```

---

## Database Schema

### Users Table

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);
```

### Migration Strategy

- Schema defined in `src/db/schema.ts`
- Migrations generated with `npm run db:generate`
- Applied with `npm run db:push` (dev) or `npm run db:migrate` (prod)
- Versioned in `drizzle/` directory

---

## Security Considerations

### Implemented

✅ Password hashing (bcrypt)
✅ JWT token expiration
✅ Input validation (Zod schemas)
✅ CORS enabled
✅ SQL injection prevention (parameterized queries via Drizzle)
✅ Unique email constraint

### Not Yet Implemented (Production TODOs)

⚠️ HTTPS/TLS in production
⚠️ Rate limiting
⚠️ Refresh tokens
⚠️ Email verification
⚠️ Password reset flow
⚠️ CSRF protection
⚠️ Helmet.js security headers
⚠️ Environment-based JWT secrets

---

## Scalability Considerations

### Current Architecture (Good for)

- Small to medium applications
- Monolithic deployment
- Single database instance

### Future Improvements

- **Horizontal Scaling**: Add load balancer, multiple app instances
- **Database**: Connection pooling (already implemented), read replicas
- **Caching**: Redis for sessions/tokens
- **Microservices**: Split auth into separate service
- **CDN**: Serve static frontend assets

---

## Development Workflow

### Setup

```bash
docker-compose up -d          # Start PostgreSQL
npm run db:push               # Push schema to DB
npm run dev                   # Start backend (port 3000)
npm run dev:client            # Start frontend (port 5173)
```

### Making Changes

#### Adding a new API endpoint:

1. Define procedure in `src/routers/auth.ts` (or new router)
2. Types automatically available in frontend
3. Use in component with `trpc.routerName.procedureName.useQuery/useMutation()`

#### Adding a new page:

1. Create component in `client/src/pages/` (see [client/ARCHITECTURE.md](client/ARCHITECTURE.md))
2. Add route in `client/src/App.tsx`
3. Add navigation links
4. Follow styling guide in [STYLING.md](STYLING.md)

#### Database changes:

1. Modify schema in `src/db/schema.ts`
2. Run `npm run db:generate` to create migration
3. Run `npm run db:push` to apply

---

## File Organization Philosophy

### Backend

- **Flat router structure**: All routers in `src/routers/`
- **Shared utilities**: `src/utils/` for cross-cutting concerns
- **Database isolation**: All DB code in `src/db/`

### Frontend

See [client/ARCHITECTURE.md](client/ARCHITECTURE.md) for detailed frontend file organization.

---

## Testing Strategy (Not Yet Implemented)

### Recommended Approach

- **Backend**: Jest + Supertest for API testing
- **Frontend**: Vitest + React Testing Library
- **E2E**: Playwright or Cypress
- **Database**: Test database with migrations

---

## Deployment Architecture

### Recommended Production Setup

```
[Users] → [CDN/Static Assets] → [React App]
                                      ↓
                              [Load Balancer]
                                      ↓
                        [Node.js Instances] × N
                                      ↓
                            [PostgreSQL RDS]
```

### Environment Variables by Environment

- **Development**: `.env` (localhost)
- **Staging**: Environment-specific configuration
- **Production**: Secrets management (AWS Secrets Manager, etc.)

---

## Summary

This project uses modern, type-safe patterns that prioritize developer experience and code quality:

- **tRPC** eliminates API contracts boilerplate
- **Drizzle ORM** provides type-safe database access
- **React + TypeScript** ensures UI type safety
- **JWT authentication** enables stateless auth
- **Modular architecture** supports growth

The architecture is suitable for startups and small-to-medium applications that need rapid development with strong type safety guarantees.
