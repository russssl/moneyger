FROM oven/bun:1 AS builder

# Set environment variables for build time (before any code is copied)
ENV SKIP_ENV_VALIDATION=true

WORKDIR /app

COPY package.json bun.lock ./

RUN bun install --frozen-lockfile

COPY . .

RUN bun run build

FROM oven/bun:1

WORKDIR /app

COPY --from=builder /app ./

EXPOSE 4000

CMD sh -c 'if [ "$SKIP_MIGRATE" != "true" ]; then bun run db:migrate && bun start; else bun start; fi'
