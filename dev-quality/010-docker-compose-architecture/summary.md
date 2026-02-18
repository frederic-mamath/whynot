# Dev-Quality Track 010: Docker Compose Architecture & Render Deployment

**Status**: 🔵 In Progress (Phase 5 - Documentation)  
**Related ADR**: [ADR-001: Custom FFmpeg RTMP Relay](../../docs/adr/001-custom-ffmpeg-rtmp-relay.md)  
**Created**: 2026-02-18  
**Started**: 2026-02-18  
**Deployed**: 2026-02-18  
**Estimated Duration**: 10-13 hours

---

## 🎯 Objective

Migrate the WhyNot application to a Docker Compose architecture to prepare for the custom FFmpeg RTMP relay implementation and enable deployment to Render.com.

**Goal**: By the end of this track, the application should be fully dockerized and successfully deployed to Render.com.

---

## 📋 Context

Following ADR-001, we need to build a custom FFmpeg-based RTMP relay service using Docker containers. Before implementing the FFmpeg worker (feature track), we must first establish a solid Docker infrastructure for the existing backend, database, and Redis queue.

**Current State**:

- ✅ Backend runs with `npm run dev` (builds + serves frontend)
- ✅ PostgreSQL already has docker-compose configuration
- ❌ Redis not yet integrated
- ❌ Backend not containerized
- ❌ No Render deployment configuration

**Target State**:

- ✅ Docker Compose orchestrates: backend + postgres + redis
- ✅ Backend container builds client files and serves them
- ✅ render.yaml configured for production deployment
- ✅ Application running on Render.com
- ✅ Documentation updated with Docker instructions

---

## 🗺️ Phase Overview

| Phase | Title                                                        | Duration | Status         |
| ----- | ------------------------------------------------------------ | -------- | -------------- |
| 1     | [Assessment & Redis Setup](phase-1-assessment-redis.md)      | 2h       | ✅ Completed   |
| 2     | [Backend Dockerization](phase-2-backend-docker.md)           | 3-4h     | ✅ Completed   |
| 3     | [Docker Compose Integration](phase-3-compose-integration.md) | 2h       | ✅ Completed   |
| 4     | [Render Deployment Setup](phase-4-render-deployment.md)      | 2-3h     | ✅ Completed   |
| 5     | [Documentation & Cleanup](phase-5-documentation.md)          | 1-2h     | 🔵 In Progress |

---

## 🎯 Success Criteria

### Technical

- [x] `docker-compose up` starts all services (backend, postgres, redis)
- [x] Backend accessible at `http://localhost:3000`
- [x] Frontend served correctly by backend
- [x] Database migrations run successfully in container
- [x] Redis connection working from backend
- [x] Application deployed and running on Render.com
- [x] All environment variables properly configured
- [x] Migrations run automatically on container startup

### Documentation

- [x] README.md updated with Docker setup instructions
- [x] render.yaml created and documented
- [x] RENDER_DEPLOYMENT.md guide created
- [x] RENDER_ENV_CHECKLIST.md created
- [ ] Troubleshooting guide for common issues (final polish)
- [x] Old Heroku setup preserved (Procfile still present)

### Quality

- [x] No breaking changes to existing functionality
- [x] Environment parity (dev/prod)
- [x] Proper volume management (data persistence)
- [x] Clear separation of concerns (services)
- [x] Auto-migrations on deploy (no manual intervention needed)

---

## 📊 Progress Tracking

### Overall Progress: 85% (23/27 tasks)

```
Phase 1: ✅✅✅✅✅ (5/5 tasks) ✅ COMPLETED
Phase 2: ✅✅✅✅✅✅✅ (7/7 tasks) ✅ COMPLETED
Phase 3: ✅✅✅✅✅ (5/5 tasks) ✅ COMPLETED
Phase 4: ✅✅✅✅✅✅ (6/6 tasks) ✅ COMPLETED
Phase 5: ⬜⬜⬜⬜ (0/4 tasks) 🔵 IN PROGRESS
```

---

## 🚀 Key Deliverables

### Configuration Files

- [x] `Dockerfile` - Multi-stage build for backend
- [x] `docker-compose.yml` - Orchestration (backend + postgres + redis)
- [x] `render.yaml` - Render deployment configuration
- [x] `.dockerignore` - Exclude unnecessary files

### Scripts

- [x] `scripts/docker-dev.sh` - Start development environment
- [x] `scripts/docker-migrate.sh` - Run migrations in container
- [x] `scripts/docker-clean.sh` - Clean up containers/volumes
- [x] `scripts/docker-stop.sh` - Stop all services
- [x] `scripts/docker-logs.sh` - View logs
- [x] `scripts/docker-shell.sh` - Open shell in container

### Documentation

- [ ] `README.md` - Updated with Docker instructions
- [ ] `DEPLOYMENT.md` - Updated with Render instructions
- [x] `RENDER_DEPLOYMENT.md` - Render deployment guide (new)
- [x] `RENDER_ENV_CHECKLIST.md` - Environment variables checklist (new)

---

## 🔗 Dependencies

### Prerequisites

- Docker Desktop installed (version 20.10+)
- Docker Compose V2 (included in Docker Desktop)
- Render.com account (free tier OK)
- GitHub repository connected to Render

### Blockers

None identified. All dependencies are available.

---

## 🎓 Technical Decisions

### Architecture Choices

**Why shared container for backend + client?**

- Backend already serves frontend files (`npm run build` → served by Express)
- No need for separate Nginx container
- Simpler deployment (1 service on Render vs 2)
- Faster builds (bundle frontend into backend image)

**Why Render.com over Heroku?**

- 84% cheaper ($127/month vs $815/month for production)
- Native docker-compose support
- Free tier for PoC testing
- Simpler pricing model

**Why no hot reload?**

- Focus on production-ready setup first
- Hot reload can be added later with volumes (dev-quality track 011)
- Current priority: stable deployment pipeline

---

## 📝 Notes

- **Keep Heroku setup**: Don't remove `Procfile` or Heroku config until explicit permission
- **Solo project**: No team coordination needed, can move fast
- **Render.yaml**: Will be tested on Render Hobby plan (free) during Phase 4
- **Backward compatibility**: Old `npm run dev` should still work until migration complete

---

## 🔄 Next Track

After completing this track:

- **Feature Track**: FFmpeg Worker Implementation (ADR-001)
  - Build ffmpeg-worker service
  - Implement RedisQueue integration
  - Connect backend → Redis → FFmpeg
  - Add to docker-compose and render.yaml

---

## 📅 Milestones

| Date       | Milestone                  | Status         |
| ---------- | -------------------------- | -------------- |
| 2026-02-18 | Track created              | ✅ Done        |
| 2026-02-18 | Phase 1 completed          | ✅ Done        |
| 2026-02-18 | Phase 2 completed          | ✅ Done        |
| 2026-02-18 | Phase 3 completed          | ✅ Done        |
| 2026-02-18 | Phase 4 completed          | ✅ Done        |
| 2026-02-18 | **Deployed to Render.com** | ✅ Done        |
| 2026-02-18 | Phase 5 started            | 🔵 In Progress |
| TBD        | Phase 5 completed          | ⬜             |
| TBD        | **Track completed**        | ⬜             |

---

## 🐛 Known Issues

None yet. Will be tracked as they arise during implementation.

---

## 💡 Future Enhancements

After this track is complete, consider:

1. **Hot reload setup** (dev-quality track) - Volume mounting for live editing
2. **Multi-stage optimization** - Smaller production images
3. **Health checks** - Docker health endpoints for all services
4. **Auto-scaling** - Render scaling configuration
5. **Monitoring** - Datadog/Sentry integration
6. **CI/CD** - GitHub Actions for automated testing/deployment

---

**Owner**: Frederic Mamath  
**Priority**: High (blocks FFmpeg worker implementation)  
**Tags**: #docker #infrastructure #deployment #render
