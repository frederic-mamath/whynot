# Render Environment Variables Checklist

Use this checklist when configuring environment variables in Render Dashboard.

---

## 📍 Where to Configure

**Render Dashboard → whynot-backend → Environment**

---

## ✅ Auto-Populated (from render.yaml)

These are set automatically - **DO NOT manually configure**:

### Database Connection

- ✅ `DB_HOST` - from whynot-db (host)
- ✅ `DB_PORT` - from whynot-db (port)
- ✅ `DB_NAME` - from whynot-db (database)
- ✅ `DB_USER` - from whynot-db (user)
- ✅ `DB_PASSWORD` - from whynot-db (password)

### Redis Connection

- ⚠️ `REDIS_URL` - **Manual setup required** (see Redis Setup section below)

### Application Defaults

- ✅ `NODE_ENV=production`
- ✅ `PORT=3000`
- ✅ `JWT_SECRET` - auto-generated (secure random string)

---

## 🔴 Redis Setup (Required First!)

**Render doesn't support Redis natively in blueprints.** You need to use Upstash (free tier available):

### Step 1: Create Upstash Account

1. Go to https://upstash.com
2. Sign up (free account)
3. Verify email

### Step 2: Create Redis Database

1. Dashboard → Create Database
2. Name: `whynot-redis`
3. Type: **Regional** (faster, free tier available)
4. Region: **US-East-1** or closest to your Render region (oregon = us-west)
5. Click "Create"

### Step 3: Get Connection String

1. Click on your database
2. Copy **UPSTASH_REDIS_REST_URL** or **Redis URL**
3. Format: `redis://default:XXXXXXX@us1-xxxxx.upstash.io:6379`

### Step 4: Add to Render

1. Render Dashboard → whynot-backend → Environment
2. Add variable:
   ```
   REDIS_URL=redis://default:XXXXXXX@us1-xxxxx.upstash.io:6379
   ```

**Free Tier Limits**:

- 10,000 commands per day
- 256 MB storage
- Perfect for development/MVP

**Alternative**: Use Redis Labs or any Redis provider with connection string

---

## ⚠️ Required Manual Configuration

Copy these from your local `.env` file or service provider dashboards:

### Agora RTC (required for live streaming)

```bash
AGORA_APP_ID=
AGORA_APP_CERTIFICATE=
AGORA_CUSTOMER_ID=
AGORA_CUSTOMER_SECRET=
```

**Where to find**:

- Agora Console: https://console.agora.io
- Project → Config → Primary Certificate

---

### Cloudflare Stream (required for video playback)

```bash
CLOUDFLARE_STREAM_ACCOUNT_ID=
CLOUDFLARE_STREAM_API_TOKEN=
```

**Where to find**:

- Cloudflare Dashboard: https://dash.cloudflare.com
- Stream → API Tokens

---

### Stripe (required for payments)

```bash
STRIPE_SECRET_KEY=sk_live_... (or sk_test_...)
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PUBLISHABLE_KEY=pk_live_... (or pk_test_...)
```

**Where to find**:

- Stripe Dashboard: https://dashboard.stripe.com
- Developers → API keys
- Developers → Webhooks (for webhook secret)

**⚠️ Important**: Update webhook URL in Stripe:

- Endpoint: `https://whynot-backend-XXXX.onrender.com/api/stripe/webhook`
- Events to send: `checkout.session.completed`, `payment_intent.succeeded`

---

## 🔹 Optional Configuration

### AWS S3 (for Agora cloud recording storage)

```bash
AWS_S3_ACCESS_KEY=
AWS_S3_SECRET_KEY=
AWS_S3_BUCKET=whynot-agora-recordings
```

**Where to find**:

- AWS IAM Console: https://console.aws.amazon.com/iam
- Users → Your User → Security Credentials → Create Access Key

**Setup**:

1. Create S3 bucket: `whynot-agora-recordings`
2. Create IAM user with S3 write permissions
3. Generate access key
4. Configure CORS for bucket

**Alternative**: If not set, recordings may use Agora's default storage

---

## 📋 Configuration Steps

### 1. Prepare Your Values

Create a temporary text file with your values:

```bash
# AGORA
AGORA_APP_ID=abc123...
AGORA_APP_CERTIFICATE=def456...
AGORA_CUSTOMER_ID=ghi789...
AGORA_CUSTOMER_SECRET=jkl012...

# CLOUDFLARE
CLOUDFLARE_STREAM_ACCOUNT_ID=mno345...
CLOUDFLARE_STREAM_API_TOKEN=pqr678...

# STRIPE
STRIPE_SECRET_KEY=sk_live_abc123...
STRIPE_WEBHOOK_SECRET=whsec_def456...
STRIPE_PUBLISHABLE_KEY=pk_live_ghi789...

# AWS (optional)
AWS_S3_ACCESS_KEY=AKIAIOSFODNN7EXAMPLE
AWS_S3_SECRET_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_S3_BUCKET=whynot-agora-recordings
```

### 2. Add to Render Dashboard

For each variable:

1. Click "Add Environment Variable"
2. Enter **Key** (exact name, e.g., `AGORA_APP_ID`)
3. Enter **Value** (the actual secret)
4. Click "Save Changes"

### 3. Verify All Variables

After adding all variables, you should see:

**Auto-populated** (9 variables):

- DB_HOST
- DB_PORT
- DB_NAME
- DB_USER
- DB_PASSWORD
- REDIS_URL
- NODE_ENV
- PORT
- JWT_SECRET

**Manually added** (minimum 10 variables):

- AGORA_APP_ID
- AGORA_APP_CERTIFICATE
- AGORA_CUSTOMER_ID
- AGORA_CUSTOMER_SECRET
- CLOUDFLARE_STREAM_ACCOUNT_ID
- CLOUDFLARE_STREAM_API_TOKEN
- STRIPE_SECRET_KEY
- STRIPE_WEBHOOK_SECRET
- STRIPE_PUBLISHABLE_KEY

**Optional** (3 variables):

- AWS_S3_ACCESS_KEY
- AWS_S3_SECRET_KEY
- AWS_S3_BUCKET

**Total**: 19-22 variables

---

## 🔒 Security Best Practices

1. **Never commit secrets to git**
   - ✅ All secrets marked `sync: false` in render.yaml
   - ✅ Render won't sync these from .env files

2. **Use production keys**
   - For production: `sk_live_...`, `pk_live_...`
   - For testing: `sk_test_...`, `pk_test_...`

3. **Rotate keys regularly**
   - Stripe: Every 90 days recommended
   - AWS: Every 90 days recommended
   - Agora: When team members change

4. **Restrict API key permissions**
   - AWS IAM: Only S3 write to specific bucket
   - Stripe: Restrict to necessary operations
   - Cloudflare: Scoped to Stream only

5. **Monitor usage**
   - Check Stripe Dashboard for unusual activity
   - Check AWS CloudWatch for S3 access
   - Check Agora Console for usage spikes

---

## 🧪 Test Configuration

After setting all variables:

1. **Trigger Redeploy**
   - Dashboard → Manual Deploy → Deploy latest commit

2. **Check Logs**

   ```
   ✅ Database connected successfully
   ✅ Redis connected successfully
   Server running on http://localhost:3000
   ```

3. **Test Endpoints**

   ```bash
   # Health check
   curl https://whynot-backend-XXXX.onrender.com/health

   # Should return 200 OK
   ```

4. **Test Features**
   - Create a test channel (tests Agora)
   - Start streaming (tests Cloudflare)
   - Make test payment (tests Stripe)

---

## ❌ Common Mistakes

### Missing Variables

**Error**: `STRIPE_SECRET_KEY is required`
**Fix**: Add all required variables

### Wrong Format

**Error**: `Invalid Stripe key`
**Fix**: Ensure no extra spaces, quotes, or newlines

### Production vs Test Keys

**Error**: Stripe payments failing
**Fix**: Use `sk_live_...` for production, `sk_test_...` for testing

### Database Connection Issues

**Error**: `Connection refused`
**Fix**: Don't override auto-populated DB variables

---

## 📞 Support

If you encounter issues:

1. **Check Render Logs**
   - Dashboard → whynot-backend → Logs
   - Look for specific error messages

2. **Verify Variable Names**
   - Must match exactly (case-sensitive)
   - No extra spaces

3. **Test Locally First**
   - Run `docker-compose up` locally
   - If it works locally, config is correct

4. **Check Service Status**
   - Agora Console: Service active?
   - Stripe Dashboard: API keys valid?
   - Cloudflare: Account ID correct?

---

## ✅ Final Checklist

Before marking configuration complete:

- [ ] All Agora variables added (4)
- [ ] All Cloudflare variables added (2)
- [ ] All Stripe variables added (3)
- [ ] AWS variables added (if using S3) (3)
- [ ] Deployment triggered
- [ ] Logs show no "required" errors
- [ ] Health endpoint returns 200
- [ ] Test channel creation works
- [ ] Test payment works (if using Stripe)

---

**Ready to deploy!** 🚀
