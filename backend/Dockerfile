FROM node:20-slim AS builder

RUN corepack enable && corepack prepare pnpm@8 --activate
RUN apt-get update -y && apt-get install -y openssl libssl-dev && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json ./
COPY prisma ./prisma/

RUN pnpm install

COPY . .

RUN npx prisma generate
RUN pnpm run build

FROM node:20-slim

RUN corepack enable && corepack prepare pnpm@8 --activate
RUN apt-get update -y && apt-get install -y openssl libssl3 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=builder /app ./

RUN pnpm prune --prod

EXPOSE 5000

CMD ["pnpm", "start"]
