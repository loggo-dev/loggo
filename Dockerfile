FROM node:22-alpine AS base

FROM base AS deps
WORKDIR /app
RUN corepack enable
# better-sqlite3 is a native addon - these are needed to build it for musl (alpine).
RUN apk add --no-cache python3 make g++
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app
RUN corepack enable
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 loggo \
  && mkdir -p /app/data \
  && chown -R loggo:nodejs /app/data

COPY --from=builder /app/public ./public
COPY --from=builder --chown=loggo:nodejs /app/.next/standalone ./
COPY --from=builder --chown=loggo:nodejs /app/.next/static ./.next/static

USER loggo
EXPOSE 3000
ENV PORT=3000
ENV SQLITE_PATH=/app/data/loggo.db
ENV STORAGE_PATH=/app/data
VOLUME ["/app/data"]

CMD ["node", "server.js"]
