# ---- Build Stage ----
FROM node:22-alpine AS builder

# Build-time variables needed by Vite's `define` (baked into the JS bundle).
# These must be ARGs so `docker build --build-arg ...` can inject them.
ARG VITE_STRIPE_PUBLISHABLE_KEY
ARG VITE_API_URL
ARG VITE_POSTHOG_KEY
ARG VITE_POSTHOG_HOST
ENV VITE_STRIPE_PUBLISHABLE_KEY=$VITE_STRIPE_PUBLISHABLE_KEY
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_POSTHOG_KEY=$VITE_POSTHOG_KEY
ENV VITE_POSTHOG_HOST=$VITE_POSTHOG_HOST

WORKDIR /app

# Sibling folders referenced via `../` from app/package.json scripts:
#   - design-tokens/generate.mjs  → postinstall + prebuild hooks
#   - scripts/arch-test.mjs       → arch:test (called from prebuild:server/client)
# Both must sit one level above /app so the relative paths resolve.
COPY design-tokens /design-tokens
COPY scripts /scripts

# Install dependencies first (better cache). postinstall now finds /design-tokens.
COPY app/package.json app/package-lock.json app/.npmrc ./
RUN npm ci

# Copy the rest of the server + client source
COPY app/ ./

# Build server (TypeScript → dist/) and client (Vite → dist/public/)
RUN npm run build

# ---- Production Stage ----
FROM node:22-alpine

WORKDIR /app

# Install production dependencies + tsx for migrations.
# --ignore-scripts skips the postinstall token generator: its only output is the
# Vite tokens.css, which is already baked into dist/public/ from the builder
# stage. No production dependency has a meaningful build hook on alpine.
COPY app/package.json app/package-lock.json app/.npmrc ./
RUN npm ci --omit=dev --ignore-scripts \
 && npm install tsx --ignore-scripts \
 && npm cache clean --force

# Copy built artifacts from builder
COPY --from=builder /app/dist ./dist

# Copy migrations for startup execution
COPY app/migrations ./migrations
COPY app/migrate.ts ./migrate.ts
COPY app/src/db ./src/db

# Copy entrypoint script
COPY app/entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1

ENTRYPOINT ["./entrypoint.sh"]
