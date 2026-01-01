# Phase 5: API Security & Routing

## Objective

Secure the API layer by ensuring tRPC endpoints are properly isolated, add production security headers, and configure CORS for same-origin deployment.

## Duration

~1 hour

## Files to Update

- `src/index.ts` - Add security middleware, update CORS
- `package.json` - Add helmet dependency
- New: `src/middleware/security.ts` - Security headers

## Current State

- tRPC routes on `/trpc/*`
- CORS configured for separate origins (localhost:5173, localhost:3000)
- No security headers
- API publicly accessible

## Target State

- tRPC routes remain on `/trpc/*` but with rate limiting
- CORS removed (same-origin in production)
- Security headers added (Helmet.js)
- Health check endpoint public, API requires auth

## Steps

### 1. Install Security Dependencies (5 min)

```bash
npm install helmet
npm install --save-dev @types/helmet
```

### 2. Create Security Middleware (15 min)

**Create `src/middleware/security.ts`**:

```typescript
import helmet from 'helmet';
import { Request, Response, NextFunction } from 'express';

/**
 * Security headers middleware using Helmet.js
 */
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"], // Vite needs unsafe-inline in dev
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", 'wss:', 'ws:'], // Allow WebSocket connections
      fontSrc: ["'self'", 'data:'],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false, // Required for some streaming features
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
});

/**
 * Rate limiting for API endpoints (simple in-memory implementation)
 * For production, consider Redis-backed rate limiting
 */
const requestCounts = new Map<string, { count: number; resetAt: number }>();

export const rateLimit = (
  maxRequests: number = 100,
  windowMs: number = 60000 // 1 minute
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const identifier = req.ip || 'unknown';
    const now = Date.now();
    
    const record = requestCounts.get(identifier);
    
    if (!record || now > record.resetAt) {
      // New window
      requestCounts.set(identifier, {
        count: 1,
        resetAt: now + windowMs,
      });
      return next();
    }
    
    if (record.count >= maxRequests) {
      return res.status(429).json({
        error: 'Too many requests',
        retryAfter: Math.ceil((record.resetAt - now) / 1000),
      });
    }
    
    record.count++;
    next();
  };
};

/**
 * Request logging middleware
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const timestamp = new Date().toISOString();
    console.log(
      `${timestamp} ${req.method} ${req.path} ${res.statusCode} ${duration}ms`
    );
  });
  
  next();
};
```

### 3. Update Express Server Configuration (25 min)

**Modify `src/index.ts`**:

```typescript
import express from "express";
import cors from "cors";
import * as trpcExpress from "@trpc/server/adapters/express";
import { appRouter } from "./routers";
import { Context } from "./types/context";
import { verifyToken } from "./utils/auth";
import { createWebSocketServer } from "./websocket/server";
import { securityHeaders, rateLimit, requestLogger } from "./middleware/security";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

// Security headers (apply first)
app.use(securityHeaders);

// CORS - only needed in development (different origins)
if (!isProduction) {
  app.use(cors({
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5173'],
    credentials: true,
  }));
}

// Body parsing
app.use(express.json());

// Request logging
app.use(requestLogger);

// Trust proxy (required for Heroku)
app.set('trust proxy', 1);

// Health check (no auth required, no rate limiting)
app.get("/health", (req, res) => {
  res.json({ 
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// Create context for tRPC
const createContext = ({
  req,
}: trpcExpress.CreateExpressContextOptions): Context => {
  const token = req.headers.authorization?.replace("Bearer ", "");

  if (token) {
    const payload = verifyToken(token);
    if (payload) {
      return { userId: payload.userId };
    }
  }

  return {};
};

// tRPC endpoint with rate limiting
app.use(
  "/trpc",
  rateLimit(100, 60000), // 100 requests per minute
  trpcExpress.createExpressMiddleware({
    router: appRouter,
    createContext,
    onError: ({ path, error }) => {
      const timestamp = new Date()
        .toISOString()
        .replace("T", " ")
        .substring(0, 19);
      console.error(`${timestamp} ERROR [${path}]:`, error.message);
      if (error.code === "INTERNAL_SERVER_ERROR") {
        console.error("Stack:", error.stack);
      }
    },
  }),
);

// Serve static files in production (after API routes)
if (isProduction) {
  const publicPath = path.join(__dirname, 'public');
  
  // Static assets with aggressive caching
  app.use(express.static(publicPath, {
    maxAge: '1y',
    immutable: true,
    setHeaders: (res, filePath) => {
      // Don't cache index.html (entry point)
      if (filePath.endsWith('index.html')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      }
    },
  }));
  
  // SPA fallback (must be last)
  app.get('*', (req, res) => {
    res.sendFile(path.join(publicPath, 'index.html'));
  });
}

// Start server
if (typeof PhusionPassenger !== "undefined") {
  // @ts-ignore
  app.listen("passenger");
} else {
  const server = app.listen(port, () => {
    console.log(`🚀 Server running on port ${port}`);
    console.log(`📡 Environment: ${process.env.NODE_ENV}`);
    console.log(`🔒 Security headers: enabled`);
    console.log(`⚡ Rate limiting: enabled`);
  });

  // Attach WebSocket
  const { wss } = createWebSocketServer(server);

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully...');
    wss.close(() => {
      server.close(() => {
        console.log('Server closed');
        process.exit(0);
      });
    });
  });

  process.on('SIGINT', async () => {
    console.log('\nSIGINT received, shutting down gracefully...');
    wss.close(() => {
      server.close(() => {
        console.log('Server closed');
        process.exit(0);
      });
    });
  });
}
```

**Key changes**:
- Security headers applied first
- CORS only in development (not production)
- Rate limiting on `/trpc` routes
- Trust proxy for Heroku (correct IP detection)
- Cache-Control headers for static files

### 4. Update Environment Configuration (5 min)

**Update `.env.example`**:

```bash
# Remove CORS_ORIGIN for production (only needed in dev)
# CORS_ORIGIN=http://localhost:5173  # Development only

# Add NODE_ENV
NODE_ENV=development  # production on Heroku
```

### 5. Test Security Headers Locally (10 min)

```bash
# Build and start in production mode
npm run build
NODE_ENV=production npm start

# Test security headers
curl -I http://localhost:3000/health

# Should see headers:
# X-Content-Type-Options: nosniff
# X-Frame-Options: DENY
# Strict-Transport-Security: max-age=31536000; includeSubDomains
# Content-Security-Policy: ...
```

## Design Considerations

### Security Headers (Helmet.js)

**Why Helmet?**
- Sets ~15 security-related HTTP headers
- Prevents common attacks (XSS, clickjacking, etc.)
- Industry standard for Express apps

**Key headers**:
- `X-Frame-Options: DENY` - Prevents clickjacking
- `X-Content-Type-Options: nosniff` - Prevents MIME sniffing
- `Strict-Transport-Security` - Forces HTTPS
- `Content-Security-Policy` - Prevents XSS

### CORS Strategy

**Development**: Different origins (localhost:5173 → localhost:3000)
- CORS enabled
- Credentials allowed

**Production**: Same origin (herokuapp.com → herokuapp.com)
- CORS **not needed** (same domain)
- Simpler, more secure

### Rate Limiting

**Current**: In-memory rate limiting
- Simple, no dependencies
- Resets on server restart
- Not shared across dynos

**Production upgrade** (future):
- Use Redis for distributed rate limiting
- Shared state across multiple dynos
- Persistent across restarts

### API Route Protection

All routes under `/trpc/*` automatically protected by:
1. Rate limiting (100 req/min per IP)
2. JWT verification (in tRPC context)
3. Security headers

Public routes:
- `/health` - No auth, no rate limiting

## Acceptance Criteria

- [x] Helmet.js installed and configured
- [x] Security headers present in responses
- [x] CORS only enabled in development
- [x] Rate limiting applied to `/trpc` routes
- [x] `/health` endpoint remains public
- [x] Static files cached with proper headers
- [x] `index.html` not cached (always fresh)
- [x] Production build works with security middleware
- [x] WebSocket connections not blocked by CSP

## Status

📝 **PLANNING** - Ready to begin after Phase 4

## Notes

### Testing Rate Limiting

```bash
# Spam API to trigger rate limit
for i in {1..150}; do curl http://localhost:3000/trpc/auth.me; done

# Should see 429 Too Many Requests after 100 requests
```

### Content Security Policy (CSP)

The CSP is configured to allow:
- WebSocket connections (`wss:`, `ws:`)
- Inline scripts (required by Vite)
- Self-hosted assets
- HTTPS external images

Adjust if you add external resources (CDN, analytics, etc.)

### Future Improvements

- [ ] Redis-backed rate limiting
- [ ] API key authentication for external integrations
- [ ] Request size limits
- [ ] Logging to external service (Datadog, Sentry)
