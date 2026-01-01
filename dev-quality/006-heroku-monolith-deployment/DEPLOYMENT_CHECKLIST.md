# Phase 7: Deployment Checklist

## ✅ Pre-Deployment Verification

### Local Verification
- [x] Code changes committed to git
- [x] `Procfile` exists
- [x] `.slugignore` exists
- [x] `DEPLOYMENT.md` guide created
- [x] Database migrations tested locally
- [x] Security middleware implemented

### Manual Steps Required

## Step 1: Install Heroku CLI (if not already installed)

```bash
# macOS
brew tap heroku/brew && brew install heroku

# Verify installation
heroku --version
```

**Expected output**: `heroku/x.x.x`

---

## Step 2: Login to Heroku

```bash
heroku login
```

This will open a browser window to authenticate.

**Expected**: "Logged in as your-email@example.com"

---

## Step 3: Create Heroku Application

```bash
# Create app with a custom name (choose your own unique name)
heroku create whynot-<your-name>

# Example: heroku create whynot-frederic
```

**Expected output**:
```
Creating ⬢ whynot-<your-name>... done
https://whynot-<your-name>.herokuapp.com/ | https://git.heroku.com/whynot-<your-name>.git
```

**Verify**:
```bash
git remote -v | grep heroku
```

Should show: `heroku  https://git.heroku.com/whynot-<your-name>.git`

---

## Step 4: Provision PostgreSQL Database

```bash
# Add Postgres Mini ($5/month)
heroku addons:create heroku-postgresql:mini

# Wait for provisioning
heroku addons:wait
```

**Expected**: "Creating heroku-postgresql:mini... done"

**Verify database is ready**:
```bash
heroku pg:info
```

Should show database status and connection info.

---

## Step 5: Configure Database Environment Variables

Heroku provides `DATABASE_URL`, but our app uses individual variables. Let's parse it:

```bash
# Get the DATABASE_URL
heroku config:get DATABASE_URL
```

**You'll see something like**:
```
postgres://USER:PASSWORD@HOST:PORT/DATABASE
```

**Parse and set individual variables** (replace with your actual values):

```bash
# Example if DATABASE_URL is:
# postgres://u1abc2def:p9xyz8w@ec2-12-34-56-78.compute.amazonaws.com:5432/d1abc2def

heroku config:set DB_HOST=ec2-12-34-56-78.compute.amazonaws.com
heroku config:set DB_PORT=5432
heroku config:set DB_NAME=d1abc2def
heroku config:set DB_USER=u1abc2def
heroku config:set DB_PASSWORD=p9xyz8w
```

**Helper script to parse DATABASE_URL**:
```bash
# Run this to help parse (copy the output and run the commands)
heroku config:get DATABASE_URL | sed 's|postgres://||' | awk -F'[@:/]' '{
  print "heroku config:set DB_USER=" $1
  print "heroku config:set DB_PASSWORD=" $2
  print "heroku config:set DB_HOST=" $3
  print "heroku config:set DB_PORT=" $4
  print "heroku config:set DB_NAME=" $5
}'
```

---

## Step 6: Set Application Environment Variables

```bash
# Set production mode
heroku config:set NODE_ENV=production

# Generate secure JWT secret (64 random hex characters)
heroku config:set JWT_SECRET=$(openssl rand -hex 32)

# Set Agora credentials (get from https://console.agora.io/)
heroku config:set AGORA_APP_ID=your_actual_agora_app_id
heroku config:set AGORA_APP_CERTIFICATE=your_actual_agora_certificate
```

**Verify all config vars**:
```bash
heroku config
```

**Should show**:
```
DB_HOST:                ec2-xx-xx-xx-xx.compute.amazonaws.com
DB_NAME:                d...
DB_PASSWORD:            p...
DB_PORT:                5432
DB_USER:                u...
NODE_ENV:               production
JWT_SECRET:             <64-char-hex-string>
AGORA_APP_ID:          <your-app-id>
AGORA_APP_CERTIFICATE: <your-certificate>
DATABASE_URL:          postgres://... (auto-set by Heroku)
```

---

## Step 7: Deploy to Heroku

```bash
# Make sure all changes are committed
git add .
git commit -m "Configure for Heroku deployment - Phase 7 complete"

# Push to Heroku (this triggers deployment)
git push heroku main
```

**Watch the build process**:
- Heroku detects Node.js app
- Installs dependencies (`npm install`)
- Runs build (`npm run heroku-postbuild`)
- Launches app (`npm start`)

**Expected at the end**:
```
remote: -----> Launching...
remote:        Released vX
remote:        https://whynot-<your-name>.herokuapp.com/ deployed to Heroku
remote: 
remote: Verifying deploy... done.
```

---

## Step 8: Run Database Migrations

```bash
# Run migrations on Heroku
heroku run npm run migrate:prod
```

**Expected output**:
```
📊 Database mode: PRODUCTION (SSL enabled)
Database connected successfully
✅ Migration "000_create_users" executed successfully
✅ Migration "001_create_channels" executed successfully
✅ Migration "002_create_shops" executed successfully
✅ Migration "003_create_user_shop_roles" executed successfully
✅ Migration "004_create_products" executed successfully
✅ Migration "005_create_channel_products" executed successfully
✅ Migration "006_create_vendor_promoted_products" executed successfully
✅ Migration "007_add_user_names" executed successfully
✅ Migration "008_create_roles" executed successfully
✅ Migration "009_create_user_roles" executed successfully
✅ Migration "010_create_messages" executed successfully
✅ All migrations completed
```

**Verify tables created**:
```bash
heroku pg:psql
```

In psql:
```sql
\dt
-- Should show 13 tables
\q
```

---

## Step 9: Open and Test Your App

```bash
# Open app in browser
heroku open
```

**What to test**:
1. ✅ React app loads
2. ✅ No console errors
3. ✅ Can register a new user
4. ✅ Can login
5. ✅ WebSocket connects (check browser DevTools → Network → WS)

**Check logs**:
```bash
heroku logs --tail
```

**Look for**:
- ✅ "Server running on port..."
- ✅ "Database connected successfully"
- ✅ "WebSocket server attached and ready"
- ❌ No errors or crashes

---

## Step 10: Test Core Functionality

### Test Health Endpoint
```bash
curl https://whynot-<your-name>.herokuapp.com/health
```

**Expected**:
```json
{
  "status": "ok",
  "timestamp": "2026-01-01T15:50:00.000Z",
  "environment": "production"
}
```

### Test Security Headers
```bash
curl -I https://whynot-<your-name>.herokuapp.com/health | grep -E "Strict-Transport|X-Frame"
```

**Expected**:
```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
X-Frame-Options: SAMEORIGIN
```

### Test WebSocket (Browser Console)
Open browser DevTools and run:
```javascript
const ws = new WebSocket('wss://whynot-<your-name>.herokuapp.com');
ws.onopen = () => console.log('✅ WebSocket connected');
ws.onerror = (err) => console.error('❌ WebSocket error:', err);
```

---

## Step 11: Monitor and Verify

```bash
# Check dyno status
heroku ps

# Expected: web.1: up 2026/01/01 15:50:00

# View recent logs
heroku logs -n 100

# Monitor logs in real-time
heroku logs --tail
```

---

## ✅ Deployment Checklist

After completing all steps, verify:

- [ ] Heroku app created and accessible
- [ ] PostgreSQL Mini add-on provisioned
- [ ] All environment variables configured (DB_*, NODE_ENV, JWT_SECRET, AGORA_*)
- [ ] Code deployed successfully (`git push heroku main`)
- [ ] Database migrations completed (13 tables created)
- [ ] App responds to /health endpoint
- [ ] Security headers present
- [ ] React frontend loads in browser
- [ ] User can register/login
- [ ] WebSocket connects successfully
- [ ] No errors in `heroku logs`

---

## 🎉 Success Criteria

Your app is successfully deployed if:

1. ✅ Health check returns 200 OK
2. ✅ React app loads without errors
3. ✅ Database queries work
4. ✅ WebSocket connection established (wss://)
5. ✅ Security headers present
6. ✅ SSL/HTTPS working (automatic on Heroku)
7. ✅ No crash logs in `heroku logs`

---

## 🔧 Troubleshooting

### App Crashes on Startup
```bash
heroku logs --tail --source app
```

Common issues:
- Port not bound to `process.env.PORT` → Check src/index.ts
- Database connection fails → Verify DB_* config vars
- Missing env vars → Run `heroku config`

### Build Fails
```bash
heroku logs --tail
```

Common issues:
- Missing dependencies in package.json
- Build script fails → Test `npm run build` locally
- Node version mismatch → Check "engines" in package.json

### Database Connection Fails
```bash
heroku pg:info
heroku config | grep DB_
```

Verify all DB_* variables are set correctly.

### WebSocket Not Working
- Check protocol is `wss://` (not `ws://`)
- Verify in browser DevTools → Network → WS
- Check `heroku logs` for WebSocket errors

---

## 📊 Cost Summary

**Monthly Cost**: $10/month
- Eco dyno: $5/month
- Postgres Mini: $5/month

**Monitor costs**:
```bash
heroku billing
heroku addons
```

---

## 🎯 Next Steps After Deployment

1. **Custom Domain** (optional):
   ```bash
   heroku domains:add yourdomain.com
   ```

2. **Monitoring** (recommended):
   - Add Sentry for error tracking
   - Set up Heroku metrics

3. **Backups**:
   ```bash
   heroku pg:backups:capture
   heroku pg:backups:download
   ```

4. **Scaling** (if needed):
   ```bash
   heroku ps:scale web=1
   ```

---

## 📝 Useful Commands Reference

```bash
# App management
heroku restart                    # Restart app
heroku ps                        # Check dyno status
heroku releases                  # View release history
heroku rollback                  # Rollback to previous version

# Logs
heroku logs --tail              # Stream logs
heroku logs -n 500              # Last 500 lines
heroku logs --source app        # App logs only

# Database
heroku pg:info                  # Database info
heroku pg:psql                  # Connect to database
heroku pg:backups              # List backups
heroku pg:ps                   # Active connections

# Config
heroku config                   # List all config vars
heroku config:get KEY          # Get specific var
heroku config:set KEY=value    # Set var
heroku config:unset KEY        # Remove var
```

---

**Ready to deploy!** Follow the steps above in order. Let me know when you've completed each step and I can help troubleshoot if needed.
