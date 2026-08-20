# syntax=docker/dockerfile:1
# ─── Stage 1: Install dependencies ───────────────────────────────────────────
FROM node:20-alpine AS deps

WORKDIR /app

RUN apk add --no-cache libc6-compat

COPY package.json package-lock.json ./

RUN --mount=type=cache,target=/root/.npm \
    npm ci

# ─── Stage 2: Build Next.js + bundle the Socket.IO server ────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# NEXT_PUBLIC_* are inlined into the client bundle at build time.
ARG NEXT_PUBLIC_SOCKET_URL=https://snipio.akt9802.in
ARG NEXT_PUBLIC_APP_ORIGIN=https://snipio.akt9802.in
ENV NEXT_PUBLIC_SOCKET_URL=$NEXT_PUBLIC_SOCKET_URL
ENV NEXT_PUBLIC_APP_ORIGIN=$NEXT_PUBLIC_APP_ORIGIN

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN --mount=type=cache,target=/app/.next/cache \
    npm run build

# Bundle the TypeScript socket server into a single Node file (no tsx at runtime).
RUN npx esbuild server/socketServer.ts \
    --bundle \
    --platform=node \
    --target=node20 \
    --outfile=dist/socketServer.js

# ─── Stage 3: Minimal production image ────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3002
ENV SOCKET_PORT=3003
ENV HOSTNAME="0.0.0.0"

RUN apk add --no-cache wget && \
    addgroup --system --gid 1001 nodejs && \
    adduser  --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static     ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public           ./public
COPY --from=builder --chown=nextjs:nodejs /app/dist/socketServer.js ./socketServer.js
COPY --chown=nextjs:nodejs docker-entrypoint.sh ./docker-entrypoint.sh

RUN chmod +x /app/docker-entrypoint.sh

USER nextjs

EXPOSE 3002 3003

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["all"]
