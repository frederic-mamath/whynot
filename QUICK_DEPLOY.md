# Quick Deployment Reference

## 🚀 Deploy to Heroku (Quick Steps)

### Prerequisites
```bash
brew install heroku/brew/heroku  # Install Heroku CLI
heroku login                      # Login to Heroku
```

### 1. Create App & Database
```bash
heroku create whynot-<your-name>
heroku addons:create heroku-postgresql:mini
heroku addons:wait
```

### 2. Parse DATABASE_URL
```bash
# Get DATABASE_URL
heroku config:get DATABASE_URL

# Parse and set variables (replace with your actual values from DATABASE_URL)
heroku config:set DB_HOST=<host>
heroku config:set DB_PORT=5432
heroku config:set DB_NAME=<database>
heroku config:set DB_USER=<user>
heroku config:set DB_PASSWORD=<password>
```

### 3. Set Environment Variables
```bash
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=$(openssl rand -hex 32)
heroku config:set AGORA_APP_ID=<your-agora-app-id>
heroku config:set AGORA_APP_CERTIFICATE=<your-agora-certificate>
```

### 4. Deploy
```bash
git push heroku main
```

### 5. Run Migrations
```bash
heroku run npm run migrate:prod
```

### 6. Open App
```bash
heroku open
```

### 7. Check Status
```bash
heroku logs --tail
```

---

## ✅ Verify Deployment

- [ ] `heroku open` loads React app
- [ ] `curl https://your-app.herokuapp.com/health` returns `{"status":"ok"}`
- [ ] No errors in `heroku logs --tail`
- [ ] User can register/login
- [ ] WebSocket connects (check browser DevTools)

---

## 📚 Full Documentation

- **Complete Guide**: `DEPLOYMENT.md`
- **Step-by-Step Checklist**: `dev-quality/006-heroku-monolith-deployment/DEPLOYMENT_CHECKLIST.md`
- **Database Schema**: `dev-quality/006-heroku-monolith-deployment/DATABASE_SCHEMA.md`

---

## 💰 Cost

**$10/month** = $5 (Eco dyno) + $5 (Postgres Mini)

