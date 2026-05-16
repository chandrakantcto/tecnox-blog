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

# Generate Prisma client if Prisma exists
RUN if [ -f prisma/schema.prisma ]; then npx prisma generate; fi

# Build Next.js
RUN npm run build

# ---------------------------------------------------
# Runner
# ---------------------------------------------------
FROM base AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=80
ENV NEXT_TELEMETRY_DISABLED=1

# Non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy standalone app
COPY --from=builder /app/public ./public

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./

COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Optional (if uploads or prisma used at runtime)
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

USER nextjs

EXPOSE 80

CMD ["node", "server.js"]