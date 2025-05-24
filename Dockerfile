FROM oven/bun:1 AS builder

WORKDIR /app

COPY package.json bun.lockb ./

COPY . .

RUN bun install --frozen-lockfile

RUN bun run build

FROM oven/bun:1

WORKDIR /app

COPY --from=builder /app ./

EXPOSE 4000

CMD ["bun", "start"]
