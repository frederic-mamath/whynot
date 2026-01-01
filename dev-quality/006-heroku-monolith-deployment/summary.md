# Heroku Monolith Deployment - Summary

## Overview

Consolidate the current dual-process architecture (Express server + Vite dev server + separate WebSocket server) into a single production-ready monolith that serves both API and UI from one dyno, with WebSocket support on the same port.

## Goal

Deploy WhyNot to Heroku with minimal cost ($10/month) while maintaining all functionality including real-time WebSocket features.

## Motivation

- **Cost Efficiency**: Running 2 separate servers requires 2 Heroku dynos ($10/month). Consolidating to 1 dyno saves 50% ($5/month)
- **Simplified Development**: Single `npm start` command instead of `npm run dev` + `npm run dev:client`
- **Production Ready**: Proper static file serving, security headers, and environment configuration
- **WebSocket Consolidation**: Currently running WebSocket on separate port (3001) - incompatible with Heroku's single-port model
- **Same-Origin Benefits**: Eliminates CORS complexity when API and UI served from same domain
- **Managed Database**: Leverage Heroku Postgres Mini ($5/month) with automated backups and security

## Architecture Change

### Current (Development)
```
Process 1: Vite Dev Server (port 5173) → React UI
Process 2: Express Server (port 3000) → tRPC API  
Process 3: WebSocket Server (port 3001) → Real-time subscriptions
Database: Local Docker PostgreSQL
```

### Target (Production)
```
Single Heroku Dyno (port $PORT):
  ├── Express Server
  │   ├── /trpc/* → tRPC API
  │   ├── /health → Health check
  │   └── /* → Serve React static files (built by Vite)
  └── WebSocket Server (attached to same HTTP server)
  
Database: Heroku Postgres Mini Add-on
```

## Progress Tracking

| Phase | Description | Status |
|-------|-------------|--------|
| Phase 1 | Monolith build configuration | ✅ DONE |
| Phase 2 | WebSocket server consolidation | ✅ DONE |
| Phase 3 | Database migration preparation | ✅ DONE |
| Phase 4 | Heroku infrastructure setup | 📝 PLANNING |
| Phase 5 | API security & routing | 📝 PLANNING |
| Phase 6 | Database migration | 📝 PLANNING |
| Phase 7 | Deployment & testing | 📝 PLANNING |

## Files to Update

### Build Configuration
- [x] `package.json` - Add production build scripts
- [x] `vite.config.ts` - Configure production output paths
- [x] `tsconfig.json` - Verify build targets

### Server Changes
- [x] `src/index.ts` - Add static file serving middleware
- [x] `src/websocket/server.ts` - Accept HTTP server instance instead of port
- [x] `src/db/index.ts` - Build DATABASE_URL from env vars, support SSL in production

### Client Changes
- [x] `client/src/lib/trpc.ts` - Update WebSocket URL for production

### Configuration
- [x] `.env.example` - Document database env vars for Heroku
- [x] `package.json` - Add migrate:prod script

### New Files
- [ ] `Procfile` - Heroku process definition
- [ ] `.slugignore` - Optimize Heroku slug size
- [ ] `dev-quality/006-heroku-monolith-deployment/deployment-checklist.md` - Pre/post deployment steps

### Documentation
- [ ] `README.md` - Update deployment instructions
- [ ] `ARCHITECTURE.md` - Document production architecture

## Cost Breakdown

| Resource | Tier | Monthly Cost |
|----------|------|--------------|
| Application Dyno | Eco | $5 |
| PostgreSQL Database | Mini | $5 |
| **Total** | | **$10** |

## Metrics

### Before
- Processes: 3 (dev server, API server, WS server)
- Ports: 3 (5173, 3000, 3001)
- Dev startup: `npm run dev` + `npm run dev:client` (2 commands)
- Heroku cost: $15/month (2 dynos + DB)

### After
- Processes: 1 (Express + WebSocket)
- Ports: 1 ($PORT)
- Dev startup: `npm start` (1 command)
- Heroku cost: $10/month (1 dyno + DB)

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| WebSocket connection drops | Implement automatic reconnection (already exists) |
| Static file caching issues | Configure proper Cache-Control headers |
| Database migration failure | Test migrations locally first, backup before deploy |
| Environment variable mismatch | Document all required env vars in checklist |

## Status

📝 **PLANNING** - Track created, ready to begin Phase 1

## Next Steps

1. Begin Phase 1: Configure build pipeline
2. Test locally with production build before deploying
3. Set up Heroku staging environment first
4. Deploy to production only after staging verification

---

**Created**: 2026-01-01
**Last Updated**: 2026-01-01
**Estimated Completion**: ~9 hours across 7 phases
