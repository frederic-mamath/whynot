# Heroku Deployment Guide

## Prerequisites

- Heroku CLI installed: `brew install heroku/brew/heroku`
- Heroku account created: https://signup.heroku.com/
- Credit card on file (required for Eco tier - $5/month)
- Git repository initialized

## Step-by-Step Deployment

### 1. Install and Login to Heroku CLI

```bash
# Install Heroku CLI (macOS)
brew tap heroku/brew && brew install heroku

# Login to Heroku
heroku login

# Verify login
heroku whoami
```

### 2. Create Heroku Application

```bash
# Create app with auto-generated name
heroku create

# OR create with custom name (must be globally unique)
heroku create whynot-your-name

# Verify app created
heroku apps:info

# Note: The command automatically adds a git remote named 'heroku'
# Verify with: git remote -v
```

**Expected output**:
```
Creating app... done, ⬢ whynot-your-name
https://whynot-your-name.herokuapp.com/ | https://git.heroku.com/whynot-your-name.git
```

### 3. Provision PostgreSQL Database

```bash
# Add Postgres Mini add-on ($5/month)
heroku addons:create heroku-postgresql:mini

# Wait for provisioning to complete (~2 minutes)
heroku addons:wait

# Check database info
heroku pg:info
```

**This will automatically set `DATABASE_URL` environment variable**

### 4. Parse and Set Database Environment Variables

Heroku gives you a `DATABASE_URL`, but our app uses individual DB variables. Extract them:

```bash
# Get the DATABASE_URL
heroku config:get DATABASE_URL

# It will look like: postgres://USER:PASSWORD@HOST:PORT/DATABASE
# Parse it and set individual variables:

heroku config:set DB_HOST=<host-from-url>
heroku config:set DB_PORT=5432
heroku config:set DB_NAME=<database-from-url>
heroku config:set DB_USER=<user-from-url>
heroku config:set DB_PASSWORD=<password-from-url>
```

**Example**:
If DATABASE_URL is `postgres://myuser:mypass@ec2-1-2-3-4.compute.amazonaws.com:5432/mydb`, then:

```bash
heroku config:set DB_HOST=ec2-1-2-3-4.compute.amazonaws.com
heroku config:set DB_PORT=5432
heroku config:set DB_NAME=mydb
heroku config:set DB_USER=myuser
heroku config:set DB_PASSWORD=mypass
```

### 5. Configure Application Environment Variables

```bash
# Set production mode
heroku config:set NODE_ENV=production

# Generate and set secure JWT secret
heroku config:set JWT_SECRET=$(openssl rand -hex 32)

# Set Agora credentials (get from https://console.agora.io/)
heroku config:set AGORA_APP_ID=your_agora_app_id
heroku config:set AGORA_APP_CERTIFICATE=your_agora_certificate

# Verify all config vars
heroku config
```

**Expected config vars**:
```
DB_HOST:                ec2-xx-xx-xx-xx.compute.amazonaws.com
DB_PORT:                5432
DB_NAME:                d...
DB_USER:                u...
DB_PASSWORD:            p...
NODE_ENV:               production
JWT_SECRET:             <64-char-hex-string>
AGORA_APP_ID:          <your-app-id>
AGORA_APP_CERTIFICATE: <your-certificate>
```

### 6. Deploy to Heroku

```bash
# Commit all changes (if not already committed)
git add .
git commit -m "Configure for Heroku deployment"

# Deploy to Heroku
git push heroku main

# If your main branch is named 'master':
# git push heroku master
```

**Deployment process**:
1. Heroku receives your code
2. Detects Node.js app (via package.json)
3. Installs dependencies (`npm install`)
4. Runs build script (`npm run heroku-postbuild`)
5. Starts app (`npm start` from Procfile)

### 7. Run Database Migrations

```bash
# Run migrations on Heroku
heroku run npm run migrate:prod

# Expected output:
# 📊 Database mode: PRODUCTION (SSL enabled)
# Database connected successfully
# ✅ Migration "000_create_users" executed successfully
# ✅ Migration "001_create_channels" executed successfully
# ✅ Migration "002_create_shops" executed successfully
# ✅ Migration "003_create_user_shop_roles" executed successfully
# ✅ Migration "004_create_products" executed successfully
# ✅ Migration "005_create_channel_products" executed successfully
# ✅ Migration "006_create_vendor_promoted_products" executed successfully
# ✅ Migration "007_add_user_names" executed successfully
# ✅ Migration "008_create_roles" executed successfully
# ✅ Migration "009_create_user_roles" executed successfully
# ✅ Migration "010_create_messages" executed successfully
# ✅ All migrations completed

# Verify tables created
heroku pg:psql
# In psql:
\dt
# Should show 13 tables (11 app tables + 2 Kysely migration tables)
\q
```

### 8. Open and Test Your App

```bash
# Open app in browser
heroku open

# Watch logs in real-time
heroku logs --tail

# Check app status
heroku ps
```

## Useful Heroku Commands

### Logs and Debugging

```bash
# View logs (last 100 lines)
heroku logs

# Stream logs in real-time
heroku logs --tail

# Filter logs by source
heroku logs --source app

# View specific number of lines
heroku logs -n 500
```

### App Management

```bash
# Restart app
heroku restart

# Scale dynos
heroku ps:scale web=1

# Run one-off commands
heroku run bash
heroku run node -v
heroku run npm run migrate:prod
```

### Database Management

```bash
# Database info
heroku pg:info

# Connect to database
heroku pg:psql

# Database backups
heroku pg:backups:capture
heroku pg:backups:download
heroku pg:backups:restore b001 DATABASE_URL

# View active database connections
heroku pg:ps

# Kill all connections (careful!)
heroku pg:killall
```

### Configuration

```bash
# View all config vars
heroku config

# Get specific config var
heroku config:get NODE_ENV

# Set config var
heroku config:set KEY=value

# Unset config var
heroku config:unset KEY
```

### Releases and Rollback

```bash
# View release history
heroku releases

# Rollback to previous release
heroku rollback

# Rollback to specific release
heroku rollback v123
```

## Troubleshooting

### Build Fails

```bash
# Check build logs
heroku logs --tail

# Common issues:
# 1. Missing dependencies in package.json
# 2. Build script fails - test locally: npm run build
# 3. Node version mismatch - check engines in package.json
```

### App Crashes on Startup

```bash
# Check logs
heroku logs --tail --source app

# Common issues:
# 1. Port not bound to process.env.PORT
# 2. Database connection fails - check DB_* config vars
# 3. Missing environment variables - check heroku config
```

### Database Connection Fails

```bash
# Verify database is provisioned
heroku addons

# Check database config
heroku pg:info

# Verify connection string is set
heroku config:get DATABASE_URL

# Test connection
heroku run node -e "const pg = require('pg'); const pool = new pg.Pool({connectionString: process.env.DATABASE_URL, ssl: {rejectUnauthorized: false}}); pool.connect().then(() => console.log('Connected!')).catch(err => console.error(err));"
```

### WebSocket Not Working

- Ensure you're using `wss://` (not `ws://`) in production
- Heroku automatically handles WebSocket upgrades on the same port
- Check browser console for WebSocket connection errors

## Cost Monitoring

```bash
# View current month usage
heroku billing

# View add-on costs
heroku addons

# Expected monthly cost:
# - Eco dyno: $5/month
# - Postgres Mini: $5/month
# Total: $10/month
```

## Security Checklist

- [ ] `NODE_ENV=production` is set
- [ ] `JWT_SECRET` is a strong random string (not the example)
- [ ] Database password is secure (auto-generated by Heroku)
- [ ] No secrets committed to git (check `.env` is in `.gitignore`)
- [ ] SSL/HTTPS enabled (automatic on Heroku)

## Next Steps After Deployment

1. **Set up monitoring**: Consider adding Sentry for error tracking
2. **Configure custom domain**: `heroku domains:add yourdomain.com`
3. **Enable automated backups**: Already included with Postgres Mini
4. **Set up CI/CD**: Connect GitHub for automatic deployments
5. **Add staging environment**: Create separate app for testing

## Support

- Heroku DevCenter: https://devcenter.heroku.com/
- Heroku Status: https://status.heroku.com/
- Support: https://help.heroku.com/
