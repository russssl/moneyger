FROM oven/bun:1 AS builder

# Set environment variables for build time
ENV SKIP_ENV_VALIDATION=true

WORKDIR /app

COPY package.json bun.lock ./

RUN bun install --frozen-lockfile

COPY . .

RUN bun run build

FROM oven/bun:1

WORKDIR /app

COPY --from=builder /app ./

# prod and staging ports
EXPOSE 4000 4001 

CMD sh -c 'bun run db:migrate && bun start'