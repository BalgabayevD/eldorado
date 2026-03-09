# Build stage
FROM oven/bun:1 AS builder

# Install build tools needed for native modules (better-sqlite3 from drizzle-kit)
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .
RUN bun run build

# Production stage — only production deps, no native build tools needed
FROM oven/bun:1-slim AS runner

WORKDIR /app

COPY --from=builder /app/build ./build
COPY --from=builder /app/package.json ./

# Install only production dependencies (skips drizzle-kit and better-sqlite3)
RUN apt-get update && apt-get install -y ca-certificates && rm -rf /var/lib/apt/lists/*
COPY bun.lock ./
RUN bun install --frozen-lockfile --production

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["bun", "./build/index.js"]
