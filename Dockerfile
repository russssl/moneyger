FROM node:22-slim AS builder

ARG PUBLIC_APP_URL
ARG PUBLIC_ENVIRONMENT

ENV SKIP_ENV_VALIDATION=true
ENV PUBLIC_APP_URL=${PUBLIC_APP_URL}
ENV PUBLIC_ENVIRONMENT=${PUBLIC_ENVIRONMENT}

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
RUN corepack enable && pnpm install --frozen-lockfile

COPY . .
RUN pnpm run build

FROM node:22-slim

WORKDIR /app

COPY --from=builder /app ./

EXPOSE 3000

CMD sh -c 'pnpm run db:migrate && pnpm start'
