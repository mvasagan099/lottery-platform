# Backend Dockerfile - Multi-stage production build

FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache openssl curl

# ── Dependencies stage ──────────────────────────────────────────────────────
FROM base AS deps
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci --only=production && npm install -g prisma
RUN npx prisma generate

# ── Build stage ─────────────────────────────────────────────────────────────
FROM base AS build
COPY package*.json ./
COPY tsconfig.json ./
RUN npm ci
COPY prisma ./prisma/
RUN npx prisma generate
COPY backend/src ./backend/src/
RUN npm run build

# ── Production stage ─────────────────────────────────────────────────────────
FROM base AS production
ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/prisma ./prisma
COPY --from=build /app/backend/dist ./backend/dist

# Copy package.json for runtime
COPY package.json ./

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

EXPOSE 3001

# MED-07: Run as non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

CMD ["node", "backend/dist/server.js"]
