# Dev-Quality Track 010: Docker Compose Architecture & Render Deployment

**Status**: 🟡 Not Started  
**Related ADR**: [ADR-001: Custom FFmpeg RTMP Relay](../../docs/adr/001-custom-ffmpeg-rtmp-relay.md)  
**Created**: 2026-02-18  
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
| 1     | [Assessment & Redis Setup](phase-1-assessment-redis.md)      | 2h       | ⬜ Not Started |
| 2     | [Backend Dockerization](phase-2-backend-docker.md)           | 3-4h     | ⬜ Not Started |
| 3     | [Docker Compose Integration](phase-3-compose-integration.md) | 2h       | ⬜ Not Started |
| 4     | [Render Deployment Setup](phase-4-render-deployment.md)      | 2-3h     | ⬜ Not Started |
| 5     | [Documentation & Cleanup](phase-5-documentation.md)          | 1-2h     | ⬜ Not Started |

---

## 🎯 Success Criteria

### Technical

- [ ] `docker-compose up` starts all services (backend, postgres, redis)
- [ ] Backend accessible at `http://localhost:3000`
- [ ] Frontend served correctly by backend
- [ ] Database migrations run successfully in container
- [ ] Redis connection working from backend
- [ ] Application deployed and running on Render.com
- [ ] All environment variables properly configured

### Documentation

- [ ] README.md updated with Docker setup instructions
- [ ] render.yaml created and documented
- [ ] Troubleshooting guide for common issues
- [ ] Old Heroku setup preserved (documented separately)

### Quality

- [ ] No breaking changes to existing functionality
- [ ] Environment parity (dev/prod)
- [ ] Proper volume management (data persistence)
- [ ] Clear separation of concerns (services)

---

## 📊 Progress Tracking

### Overall Progress: 0%

```
Phase 1: ⬜⬜⬜⬜⬜ (0/5 tasks)
Phase 2: ⬜⬜⬜⬜⬜⬜⬜ (0/7 tasks)
Phase 3: ⬜⬜⬜⬜⬜ (0/5 tasks)
Phase 4: ⬜⬜⬜⬜⬜⬜ (0/6 tasks)
Phase 5: ⬜⬜⬜⬜ (0/4 tasks)
```

---

## 🚀 Key Deliverables

### Configuration Files

- [ ] `Dockerfile` - Multi-stage build for backend
- [ ] `docker-compose.yml` - Orchestration (backend + postgres + redis)
- [ ] `render.yaml` - Render deployment configuration
- [ ] `.dockerignore` - Exclude unnecessary files

### Scripts

- [ ] `scripts/docker-dev.sh` - Start development environment
- [ ] `scripts/docker-migrate.sh` - Run migrations in container
- [ ] `scripts/docker-clean.sh` - Clean up containers/volumes

### Documentation

- [ ] `README.md` - Updated with Docker instructions
- [ ] `DEPLOYMENT.md` - Updated with Render instructions
- [ ] `docs/DOCKER.md` - Troubleshooting guide (new)

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

| Date       | Milestone           | Status  |
| ---------- | ------------------- | ------- |
| 2026-02-18 | Track created       | ✅ Done |
| TBD        | Phase 1 completed   | ⬜      |
| TBD        | Phase 2 completed   | ⬜      |
| TBD        | Phase 3 completed   | ⬜      |
| TBD        | Phase 4 completed   | ⬜      |
| TBD        | Phase 5 completed   | ⬜      |
| TBD        | **Track completed** | ⬜      |

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
