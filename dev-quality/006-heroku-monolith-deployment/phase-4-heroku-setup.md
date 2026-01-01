# Phase 4: Heroku Infrastructure Setup

## Objective

Create Heroku app, provision PostgreSQL add-on, configure environment variables, and set up deployment pipeline.

## Duration

~1.5 hours

## Prerequisites

- Heroku CLI installed: `brew install heroku/brew/heroku`
- Heroku account created
- Credit card on file (required even for free/eco tiers)
- Git repository initialized

## Steps

### 1. Install and Login to Heroku CLI (10 min)

```bash
# Install Heroku CLI (macOS)
brew tap heroku/brew && brew install heroku

# Login
heroku login

# Verify login
heroku whoami
```

### 2. Create Heroku Application (15 min)

```bash
# Create app (Heroku will generate unique name)
heroku create

# Or specify custom name
heroku create whynot-app

# Verify app created
heroku apps:info

# Add Git remote (if not auto-added)
heroku git:remote -a whynot-app
```

**Output**:
```
Creating app... done, ⬢ whynot-app
https://whynot-app.herokuapp.com/ | https://git.heroku.com/whynot-app.git
```

### 3. Provision PostgreSQL Add-on (10 min)

```bash
# Add Postgres Mini ($5/month)
heroku addons:create heroku-postgresql:mini

# Wait for provisioning (~2 minutes)
heroku addons:wait

# Verify DATABASE_URL is set
heroku config:get DATABASE_URL
```

**Expected output**:
```
postgres://user:password@host:port/database
```

### 4. Configure Environment Variables (20 min)

```bash
# Set required environment variables
heroku config:set NODE_ENV=production

# Generate secure JWT secret (64 random characters)
heroku config:set JWT_SECRET=$(openssl rand -hex 32)

# Set Agora credentials (get from Agora Console)
heroku config:set AGORA_APP_ID=your_actual_app_id
heroku config:set AGORA_APP_CERTIFICATE=your_actual_certificate

# Verify all config vars
heroku config
```

**Expected config**:
```
DATABASE_URL:           postgres://...
JWT_SECRET:             64-char-random-string
NODE_ENV:               production
AGORA_APP_ID:          your_app_id
AGORA_APP_CERTIFICATE: your_certificate
```

### 5. Create Procfile (10 min)

**Create `Procfile`** in project root:

```
web: npm start
```

**Why**:
- Tells Heroku how to start the app
- `web` process type gets HTTP traffic
- Heroku sets `$PORT` environment variable

### 6. Create .slugignore (5 min)

**Create `.slugignore`** in project root:

```
# Development files (reduce slug size)
client/src
client/public
src
*.md
.git
.github
docker-compose.yml
tsconfig.json
vite.config.ts

# Test files
test-*.js
agora-diagnostic.js

# Development dependencies
.env.example
.nvmrc
.npmrc
```

**Why**:
- Reduces slug size (faster deploys)
- Only include built files (`dist/`) in production
- Smaller slugs = faster boot time

### 7. Optimize package.json for Heroku (10 min)

**Update `package.json`**:

```json
{
  "engines": {
    "node": "20.x",
    "npm": "10.x"
  },
  "scripts": {
    "build": "npm run build:server && npm run build:client",
    "build:server": "tsc",
    "build:client": "vite build",
    "start": "node dist/index.js",
    "heroku-postbuild": "npm run build"
  }
}
```

**Why**:
- `engines` specifies Node/npm versions
- `heroku-postbuild` runs automatically after `npm install`
- Heroku runs: `npm install` → `npm run heroku-postbuild` → `npm start`

### 8. Configure Buildpacks (5 min)

```bash
# Heroku auto-detects Node.js, but verify
heroku buildpacks

# Should show:
# heroku/nodejs
```

If not detected:
```bash
heroku buildpacks:set heroku/nodejs
```

### 9. Set Up Staging Environment (Optional, 10 min)

```bash
# Create staging app
heroku create whynot-staging

# Provision staging database (Mini tier)
heroku addons:create heroku-postgresql:mini -a whynot-staging

# Set staging config vars
heroku config:set NODE_ENV=staging -a whynot-staging
heroku config:set JWT_SECRET=$(openssl rand -hex 32) -a whynot-staging
# ... copy other vars

# Add staging remote
git remote add staging https://git.heroku.com/whynot-staging.git
```

### 10. Enable Heroku CLI Shortcuts (5 min)

Add to `package.json`:

```json
{
  "scripts": {
    "deploy": "git push heroku main",
    "deploy:staging": "git push staging main",
    "logs": "heroku logs --tail",
    "logs:staging": "heroku logs --tail -a whynot-staging"
  }
}
```

### 11. Test Deployment Pipeline (10 min)

**Don't deploy yet** - just verify setup:

```bash
# Check Heroku configuration
heroku apps:info

# Verify buildpack
heroku buildpacks

# Verify environment variables
heroku config

# Check database connection
heroku pg:info
```

## Heroku App Configuration Checklist

- [ ] App created on Heroku
- [ ] PostgreSQL Mini add-on provisioned
- [ ] `DATABASE_URL` auto-configured
- [ ] `NODE_ENV=production` set
- [ ] `JWT_SECRET` generated and set
- [ ] Agora credentials configured
- [ ] `Procfile` created
- [ ] `.slugignore` created
- [ ] `package.json` engines specified
- [ ] `heroku-postbuild` script added
- [ ] Git remote added for Heroku
- [ ] (Optional) Staging environment created

## Design Considerations

### Dyno Types

| Type | RAM | Price/Month | Use Case |
|------|-----|-------------|----------|
| Eco | 512MB | $5 | Dev/staging/low-traffic |
| Basic | 512MB | $7 | Simple production apps |
| Standard-1X | 512MB | $25 | Production with metrics |

**Recommendation**: Start with Eco ($5/month)

### Heroku Deployment Flow

```
Developer:
  git push heroku main

Heroku:
  1. Receives code
  2. Detects Node.js app
  3. Runs `npm install`
  4. Runs `npm run heroku-postbuild` (builds server + client)
  5. Starts app with `npm start` (from Procfile)
  6. Routes traffic to $PORT
```

### Environment Variable Security

- **Never commit secrets** to git
- Use `heroku config:set` for all secrets
- Review config: `heroku config`
- Delete vars: `heroku config:unset VAR_NAME`

### Database Connection Pooling

Heroku Postgres Mini limits:
- Max connections: 20
- Recommend pool size: 10 (leave headroom)

Configure in `src/db/index.ts`:
```typescript
new Pool({
  max: 10,
  connectionTimeoutMillis: 5000,
})
```

## Acceptance Criteria

- [x] Heroku app created and accessible
- [x] PostgreSQL add-on provisioned
- [x] All environment variables configured
- [x] `Procfile` exists and is correct
- [x] `.slugignore` optimizes slug size
- [x] `package.json` has `engines` and `heroku-postbuild`
- [x] Git remote for Heroku added
- [x] Can run `heroku config` and see all vars
- [x] Can run `heroku pg:info` and see database details

## Status

📝 **PLANNING** - Ready to begin after Phase 3

## Notes

### Useful Heroku Commands

```bash
# View logs in real-time
heroku logs --tail

# Run one-off commands
heroku run bash
heroku run npm run migrate:prod

# Restart app
heroku restart

# Open app in browser
heroku open

# Database access
heroku pg:psql
```

### Cost Monitoring

- Monitor usage: https://dashboard.heroku.com/account/billing
- Set up billing alerts in Heroku dashboard
- Eco dynos sleep after 30 min inactivity (free tier behavior)
- Upgrade to Basic ($7) for always-on

### Troubleshooting

**Build fails**:
- Check logs: `heroku logs --tail`
- Verify `heroku-postbuild` script works locally
- Check Node version matches `engines` in package.json

**App crashes on start**:
- Check logs: `heroku logs --tail`
- Verify `PORT` environment variable used
- Verify database connection (DATABASE_URL)

**Database connection fails**:
- Verify SSL enabled in `src/db/index.ts`
- Check DATABASE_URL: `heroku config:get DATABASE_URL`
- Test connection: `heroku pg:info`
