# ---- Build Stage ----
FROM node:22-alpine AS builder

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

# Install production dependencies only
COPY package.json package-lock.json .npmrc ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy built artifacts from builder
COPY --from=builder /app/dist ./dist

# Copy migrations for runtime migration support
COPY migrations ./migrations
COPY migrate.ts ./migrate.ts

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1

CMD ["node", "dist/index.js"]
