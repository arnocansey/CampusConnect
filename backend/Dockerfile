FROM node:18-alpine AS builder

RUN corepack enable && corepack prepare pnpm@8 --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma/

RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm run build

FROM node:18-alpine

RUN corepack enable && corepack prepare pnpm@8 --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma/

RUN pnpm install --prod --frozen-lockfile

COPY --from=builder /app/dist ./dist

EXPOSE 5000

CMD ["pnpm", "start"]
