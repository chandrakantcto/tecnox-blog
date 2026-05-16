# ---------------------------------------------------
# Base
# ---------------------------------------------------
FROM node:20-alpine AS base

# ---------------------------------------------------
# Dependencies
# ---------------------------------------------------
FROM base AS deps

RUN apk add --no-cache libc6-compat

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci

# ---------------------------------------------------
# Builder
# ---------------------------------------------------
FROM base AS builder

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build Next.js (MongoDB via Mongoose — no Prisma folder / COPY)
RUN npm run build

# ---------------------------------------------------
# Runner
# ---------------------------------------------------
FROM base AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=80
ENV NEXT_TELEMETRY_DISABLED=1
# Listen on all interfaces so CapRover / Docker can route to the container
ENV HOSTNAME=0.0.0.0

RUN apk add --no-cache wget

# Non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy standalone app (requires next.config: output: 'standalone')
COPY --from=builder /app/public ./public

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./

COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 80

# Matches GET /api/health — tune interval/start-period for slow cold starts if needed
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD wget -qO- http://127.0.0.1:80/api/health || exit 1

CMD ["node", "server.js"]