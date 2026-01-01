# Phase 1: Monolith Build Configuration

## Objective

Configure the build pipeline to compile both server and client into a single deployable package that Express can serve.

## Duration

~2 hours

## Files to Update

- `package.json` - Add/modify build scripts
- `vite.config.ts` - Configure production build output
- `tsconfig.json` - Verify server build configuration
- `src/index.ts` - Add static file serving middleware

## Steps

### 1. Update package.json Scripts (30 min)

**Current scripts**:
```json
"build": "tsc && vite build",
"build:server": "tsc",
"build:client": "vite build",
"start": "node dist/index.js"
```

**New scripts**:
```json
"build": "npm run build:server && npm run build:client",
"build:server": "tsc",
"build:client": "vite build",
"start": "node dist/index.js",
"start:dev": "npm run dev",
"heroku-postbuild": "npm run build"
```

**Why**:
- `build` now runs both builds sequentially
- `heroku-postbuild` automatically runs on Heroku deploy
- `start:dev` preserves old dev workflow

### 2. Configure Vite Build Output (20 min)

**Update `vite.config.ts`**:

```typescript
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    root: "./client",
    build: {
      outDir: "../dist/public", // Output to server's public directory
      emptyOutDir: true,
    },
    // ... rest of config
  };
});
```

**Why**:
- Client builds to `dist/public/` so Express can serve it
- `emptyOutDir: true` cleans old builds

### 3. Add Static File Serving to Express (45 min)

**Update `src/index.ts`** - Add **after** tRPC middleware:

```typescript
import path from 'path';

// ... existing middleware (CORS, JSON, logger, /health, /trpc)

// Serve static files from Vite build (only in production)
if (process.env.NODE_ENV === 'production') {
  const publicPath = path.join(__dirname, 'public');
  
  // Serve static assets with caching
  app.use(express.static(publicPath, {
    maxAge: '1y', // Cache static assets for 1 year
    immutable: true,
  }));
  
  // Fallback to index.html for client-side routing
  app.get('*', (req, res) => {
    res.sendFile(path.join(publicPath, 'index.html'));
  });
}
```

**Why**:
- Only serve static files in production (dev still uses Vite dev server)
- Static assets cached aggressively (they have content hashes)
- Fallback route supports React Router (SPA routing)

### 4. Verify TypeScript Build (15 min)

**Check `tsconfig.json`**:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "outDir": "./dist",
    "rootDir": "./src",
    // ... other options
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "client", "dist"]
}
```

**Why**:
- Server TypeScript compiles to `dist/`
- Client excluded from server build
- CommonJS for Node.js compatibility

### 5. Test Local Production Build (10 min)

```bash
# Build everything
npm run build

# Check output structure
ls -la dist/
ls -la dist/public/

# Start production server
NODE_ENV=production npm start

# Visit http://localhost:3000 (should serve React app)
```

## Design Considerations

### Middleware Order

**Critical**: Static file serving must come **AFTER** API routes:

```
1. CORS
2. JSON parser  
3. Logger
4. /health (health check)
5. /trpc (API routes) ← API FIRST
6. Static files ← THEN static files
7. Fallback (index.html) ← LAST (catch-all)
```

**Why**: If static files come first, `/trpc` requests might be intercepted.

### Development vs Production

- **Development**: Run Vite dev server separately (`npm run dev:client`)
- **Production**: Serve built files from Express

**Environment detection**: Use `NODE_ENV=production`

### Build Output Structure

```
dist/
├── index.js           # Compiled Express server
├── routers/           # Compiled server code
├── db/
├── utils/
└── public/            # Vite build output
    ├── index.html
    ├── assets/
    │   ├── index-[hash].js
    │   └── index-[hash].css
    └── vite.svg
```

## Acceptance Criteria

- [x] `npm run build` compiles both server and client without errors
- [x] `dist/public/index.html` exists after build
- [x] `NODE_ENV=production npm start` serves React app at `http://localhost:3000`
- [x] API routes still work: `http://localhost:3000/trpc/auth.me`
- [x] Client-side routing works (refresh `/dashboard` doesn't 404)
- [x] Static assets load with proper cache headers
- [x] Development workflow unchanged (`npm run dev` + `npm run dev:client`)

## Status

📝 **PLANNING** - Ready to begin

## Notes

- Don't modify the development workflow - developers can still use dual-process mode
- Test thoroughly before proceeding to Phase 2
- Verify all tRPC routes still work after adding static file middleware
