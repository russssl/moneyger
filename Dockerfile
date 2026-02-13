FROM oven/bun:1 AS builder

# Accept build arguments for Next.js public environment variables
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_ENVIRONMENT

# Set environment variables for build time
ENV SKIP_ENV_VALIDATION=true
ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
ENV NEXT_PUBLIC_ENVIRONMENT=${NEXT_PUBLIC_ENVIRONMENT}

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