# HeliOS Canvas — Next.js Dashboard
FROM node:22-slim AS builder

WORKDIR /app

# Install OpenSSL for Prisma
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Generate Prisma client (no DB needed) + build Next.js
RUN npx prisma generate
RUN npm run build

# Production image — standalone output only
FROM node:22-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
# Prisma client + CLI + schema needed at runtime
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder /app/prisma ./prisma

# Startup script: push schema then start server
RUN echo '#!/bin/sh\necho "Running Prisma db push..."\nnode node_modules/prisma/build/index.js db push --skip-generate --accept-data-loss 2>&1 || echo "Warning: db push failed, starting anyway"\necho "Starting HeliOS server..."\nnode server.js' > /app/start.sh && chmod +x /app/start.sh

USER nextjs

EXPOSE 3000

CMD ["/app/start.sh"]
