FROM node:20 AS builder

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm

RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm build

FROM node:20

WORKDIR /app

COPY --from=builder /app ./

EXPOSE 3000

CMD ["pnpm", "start"]