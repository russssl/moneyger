FROM oven/bun:1 AS builder

WORKDIR /app

COPY package.json bun.lock ./

COPY . .

RUN bun install --frozen-lockfile

# Set environment variables for build time
ENV SKIP_ENV_VALIDATION=true

RUN bun run build

FROM oven/bun:1

WORKDIR /app

COPY --from=builder /app ./

EXPOSE 4000

CMD bun run db:migrate && bun start
