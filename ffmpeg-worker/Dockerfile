# ============================================
# Stage 1: Base Image with FFmpeg
# ============================================
FROM node:20-slim AS base

# Install system dependencies
RUN apt-get update && apt-get install -y \
    ffmpeg \
    ca-certificates \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libwayland-client0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxkbcommon0 \
    libxrandr2 \
    xdg-utils \
    wget \
    gnupg \
    && rm -rf /var/lib/apt/lists/*

# Verify FFmpeg installation
RUN ffmpeg -version

# ============================================
# Stage 2: Dependencies
# ============================================
FROM base AS deps

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including devDependencies for build)
RUN npm ci

# ============================================
# Stage 3: Builder
# ============================================
FROM deps AS builder

WORKDIR /app

# Copy source code
COPY tsconfig.json ./
COPY src ./src
COPY public ./public

# Build TypeScript
RUN npm run build

# Verify build output
RUN ls -la dist/

# ============================================
# Stage 4: Production Runtime
# ============================================
FROM base

WORKDIR /app

# Set Puppeteer environment variables
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=false \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable

# Install Chromium/Chrome for Puppeteer
RUN wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google-chrome.list \
    && apt-get update \
    && apt-get install -y google-chrome-stable \
    && rm -rf /var/lib/apt/lists/*

# Verify Chrome installation
RUN google-chrome-stable --version

# Copy built application from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy public assets (rtc-subscriber.html)
COPY public ./public

# Create /tmp directory for FIFOs (named pipes)
RUN mkdir -p /tmp && chmod 777 /tmp

# Create non-root user for security
RUN groupadd -r worker && useradd -r -g worker worker \
    && chown -R worker:worker /app \
    && chown -R worker:worker /tmp

USER worker

# Expose health check port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3001/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

# Start worker
CMD ["node", "dist/index.js"]
