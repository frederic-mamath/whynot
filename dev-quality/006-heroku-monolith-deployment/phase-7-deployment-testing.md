# Phase 7: Deployment & Testing

## Objective

Deploy the application to Heroku, verify all functionality works in production (including WebSockets), and document the deployment process.

## Duration

~1.5 hours

## Prerequisites

- All previous phases completed
- Code committed to git
- Heroku app configured (Phase 4)
- Database migrated (Phase 6)

## Steps

### 1. Pre-Deployment Checklist (10 min)

Verify everything is ready:

```bash
# Check git status - everything should be committed
git status

# Verify local production build works
npm run build
NODE_ENV=production npm start

# Test in browser
open http://localhost:3000

# Test API
curl http://localhost:3000/health

# Test tRPC
curl -X POST http://localhost:3000/trpc/auth.me \
  -H "Content-Type: application/json" \
  -d '{"input":{}}'

# Check Heroku config
heroku config

# Verify Heroku remote exists
git remote -v | grep heroku
```

**Pre-deployment checklist**:
- [ ] All code committed to git
- [ ] Local production build successful
- [ ] All tests passing (if any)
- [ ] Environment variables set on Heroku
- [ ] Database migrated
- [ ] `Procfile` and `.slugignore` present
- [ ] No secrets in code (use config vars)

### 2. Initial Deploy to Heroku (15 min)

```bash
# Deploy to Heroku
git push heroku main

# Watch build logs
# Heroku will:
# 1. Detect Node.js app
# 2. Install dependencies (npm install)
# 3. Run heroku-postbuild (npm run build)
# 4. Start app (npm start)
```

**Expected output**:
```
remote: -----> Node.js app detected
remote: -----> Installing dependencies
remote: -----> Building app
remote:        > npm run build
remote: -----> Launching...
remote: -----> Deployed to Heroku
```

### 3. Monitor Initial Startup (10 min)

```bash
# Watch logs in real-time
heroku logs --tail

# Look for:
# ✅ "Server running on port 12345"
# ✅ "Connected to PostgreSQL database"
# ✅ "WebSocket server attached and ready"
# ❌ Any errors or crashes
```

**Common startup issues**:
- Port binding error → Check `app.listen(process.env.PORT)`
- Database connection error → Verify DATABASE_URL and SSL config
- Build failure → Check logs for which step failed

### 4. Verify App is Running (10 min)

```bash
# Open app in browser
heroku open

# Should see your React app
# Check browser console for errors

# Test health endpoint
curl https://your-app.herokuapp.com/health

# Expected response:
# {"status":"ok","timestamp":"...","environment":"production"}

# Check dyno status
heroku ps

# Should show:
# web.1: up 2024/01/01 10:00:00
```

### 5. Test Core Functionality (20 min)

**Authentication Flow**:
1. Register new user
2. Verify JWT token stored
3. Login with credentials
4. Access protected routes

**API Endpoints**:
```bash
# Test registration
curl -X POST https://your-app.herokuapp.com/trpc/auth.register \
  -H "Content-Type: application/json" \
  -d '{
    "input": {
      "email": "test@example.com",
      "password": "password123"
    }
  }'

# Test login
curl -X POST https://your-app.herokuapp.com/trpc/auth.login \
  -H "Content-Type: application/json" \
  -d '{
    "input": {
      "email": "test@example.com",
      "password": "password123"
    }
  }'

# Test authenticated endpoint (use token from login)
curl https://your-app.herokuapp.com/trpc/auth.me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 6. Test WebSocket Connection (15 min)

**Browser console test**:

```javascript
// Open DevTools on https://your-app.herokuapp.com
// Go to Network tab → Filter by WS (WebSocket)

// You should see:
// - WebSocket connection to wss://your-app.herokuapp.com
// - Status: 101 Switching Protocols
// - Connection: Upgrade

// Test WebSocket in console:
const ws = new WebSocket('wss://your-app.herokuapp.com?token=YOUR_TOKEN');
ws.onopen = () => console.log('✅ WebSocket connected');
ws.onerror = (err) => console.error('❌ WebSocket error:', err);
ws.onclose = () => console.log('WebSocket closed');
```

**Test real-time features**:
1. Open app in two browser windows
2. Login to same room in both
3. Send message in one window
4. Verify it appears in other window (real-time)

### 7. Performance Testing (10 min)

```bash
# Run Lighthouse audit
# In Chrome DevTools → Lighthouse → Run audit

# Check metrics:
# - Performance score
# - First Contentful Paint
# - Time to Interactive

# Test load time
curl -w "@curl-format.txt" -o /dev/null -s https://your-app.herokuapp.com

# Create curl-format.txt:
echo "time_namelookup:  %{time_namelookup}
time_connect:  %{time_connect}
time_starttransfer:  %{time_starttransfer}
time_total:  %{time_total}
" > curl-format.txt
```

**Performance targets**:
- First load: < 3 seconds
- Time to Interactive: < 5 seconds
- WebSocket connection: < 1 second

### 8. Monitor Error Logs (5 min)

```bash
# Watch for any errors
heroku logs --tail --source app

# Check for:
# - Uncaught exceptions
# - Database connection errors
# - WebSocket failures
# - Rate limit triggers
```

### 9. Configure Custom Domain (Optional, 10 min)

```bash
# Add custom domain
heroku domains:add www.whynot.example.com

# Get DNS target
heroku domains

# Add CNAME record in your DNS provider:
# CNAME: www.whynot.example.com → your-app.herokuapp.com

# Enable SSL (automatic on Heroku)
heroku certs:auto:enable
```

### 10. Document Deployment (10 min)

**Update `README.md`**:

```markdown
## Deployment

### Production URL
https://whynot-app.herokuapp.com

### Deploy to Heroku
```bash
git push heroku main
```

### Environment Variables
Set via Heroku config vars:
- `DATABASE_URL` (auto-set by Postgres addon)
- `JWT_SECRET` (random string)
- `NODE_ENV=production`
- `AGORA_APP_ID`
- `AGORA_APP_CERTIFICATE`

### View Logs
```bash
heroku logs --tail
```

### Database Access
```bash
heroku pg:psql
```

### Rollback Deployment
```bash
heroku releases
heroku rollback v123
```
```

## Design Considerations

### Deployment Strategy

**Initial deploy**: Direct push to production
**Future deploys**:
1. Test locally
2. Deploy to staging (if exists)
3. Verify functionality
4. Deploy to production
5. Monitor logs

### Zero-Downtime Deploys

Heroku provides automatic zero-downtime deploys:
1. New dyno spun up
2. New dyno starts successfully
3. Traffic switched to new dyno
4. Old dyno terminated

**Requirements**:
- App must start within 60 seconds
- Health checks must pass

### Monitoring & Alerts

**Free tier monitoring**:
```bash
# Dyno metrics
heroku ps

# Resource usage
heroku logs --tail | grep "Memory"

# Error tracking
heroku logs --tail | grep "ERROR"
```

**Paid monitoring** (recommended for production):
- Heroku Metrics (view in dashboard)
- Papertrail (log management)
- Sentry (error tracking)
- New Relic (APM)

### Rollback Strategy

If deployment breaks production:

```bash
# List releases
heroku releases

# Output:
# v5  Deploy abc123  user@example.com  2024/01/01 10:00:00
# v4  Deploy def456  user@example.com  2024/01/01 09:00:00

# Rollback to previous version
heroku rollback v4

# Or rollback one version
heroku rollback
```

**Rollback is instant** - no rebuild needed.

## Acceptance Criteria

- [x] App successfully deployed to Heroku
- [x] Health check endpoint returns 200 OK
- [x] React app loads in browser
- [x] User can register and login
- [x] JWT authentication works
- [x] WebSocket connection established
- [x] Real-time features work (chat, subscriptions)
- [x] Database queries execute successfully
- [x] Static assets load with proper caching
- [x] No errors in production logs
- [x] Security headers present in responses
- [x] Performance within acceptable range
- [x] README.md updated with deployment instructions

## Status

📝 **PLANNING** - Ready to begin after Phase 6

## Post-Deployment Checklist

- [ ] Production URL accessible
- [ ] All features tested and working
- [ ] WebSocket connections stable
- [ ] Database queries fast (< 100ms)
- [ ] No memory leaks (monitor for 24h)
- [ ] Logs show no errors
- [ ] Performance meets targets
- [ ] Team notified of new deployment
- [ ] Documentation updated

## Troubleshooting

### App crashes on startup

```bash
# Check logs
heroku logs --tail

# Common issues:
# 1. Port not bound correctly → Use process.env.PORT
# 2. Database connection fails → Check DATABASE_URL and SSL
# 3. Missing dependencies → Verify package.json
# 4. Build errors → Check heroku-postbuild script
```

### WebSocket fails to connect

```bash
# Check WebSocket upgrade
# In browser DevTools → Network → WS tab

# Common issues:
# 1. Wrong protocol (ws vs wss) → Use wss for HTTPS
# 2. CORS blocking → Should not happen (same origin)
# 3. Token not passed → Check query parameter
# 4. Server not attached → Verify createWebSocketServer(server)
```

### Slow performance

```bash
# Check dyno resources
heroku ps:scale

# Upgrade dyno type if needed
heroku ps:resize web=standard-1x

# Check database performance
heroku pg:diagnose

# Add database indexes if needed
```

### Out of memory

```bash
# Check memory usage
heroku logs --tail | grep "Memory"

# If consistently high:
# 1. Check for memory leaks (connection pools)
# 2. Optimize queries (reduce data fetching)
# 3. Upgrade dyno (more RAM)
```

## Next Steps

After successful deployment:

1. **Set up monitoring**: Add Sentry for error tracking
2. **Configure CI/CD**: Automate deployments from GitHub
3. **Add staging environment**: Test before production
4. **Set up backups**: Automated database backups
5. **Monitor costs**: Track Heroku usage and optimize

## Cost Monitoring

```bash
# View current costs
heroku billing

# Check add-on costs
heroku addons

# Expected monthly cost:
# - Eco dyno: $5
# - Postgres Mini: $5
# Total: $10/month
```

Set budget alerts in Heroku dashboard to avoid surprises.
