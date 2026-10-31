# Build stage
FROM node:24-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage
FROM node:24-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV DATA_DIR=/app/data
# node:sqlite is still marked experimental; silence the startup warning
ENV NODE_OPTIONS=--disable-warning=ExperimentalWarning

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/scripts ./scripts

RUN mkdir -p /app/data && chown -R nextjs:nodejs /app

VOLUME ["/app/data"]
EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Starts as root only to fix ownership of the data folder, then drops to nextjs
CMD ["node", "scripts/start.cjs"]
