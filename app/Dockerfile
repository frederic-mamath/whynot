# ---- Build Stage ----
FROM node:22-alpine AS builder

# Build-time variables needed by Vite's `define` (baked into the JS bundle).
# These must be ARGs so `docker build --build-arg ...` can inject them.
ARG VITE_STRIPE_PUBLISHABLE_KEY
ARG VITE_API_URL
ENV VITE_STRIPE_PUBLISHABLE_KEY=$VITE_STRIPE_PUBLISHABLE_KEY
ENV VITE_API_URL=$VITE_API_URL

WORKDIR /app

# Install dependencies first (better cache)
COPY package.json package-lock.json .npmrc ./
RUN npm ci

# Copy source code
COPY . .

# Build server (TypeScript → dist/) and client (Vite → dist/public/)
RUN npm run build

# ---- Production Stage ----
FROM node:22-alpine

WORKDIR /app

# Install production dependencies + tsx for migrations
COPY package.json package-lock.json .npmrc ./
RUN npm ci --omit=dev && npm install tsx && npm cache clean --force

# Copy built artifacts from builder
COPY --from=builder /app/dist ./dist

# Copy migrations for startup execution
COPY migrations ./migrations
COPY migrate.ts ./migrate.ts
COPY src/db ./src/db

# Copy entrypoint script
COPY entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1

ENTRYPOINT ["./entrypoint.sh"]
