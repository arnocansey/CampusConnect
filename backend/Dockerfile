FROM node:18-alpine AS builder

RUN corepack enable && corepack prepare pnpm@8 --activate

WORKDIR /app

COPY package.json ./
COPY prisma ./prisma/

RUN pnpm install

COPY . .

RUN pnpm run build

FROM node:18-alpine

RUN corepack enable && corepack prepare pnpm@8 --activate

WORKDIR /app

COPY --from=builder /app ./

RUN pnpm prune --prod

EXPOSE 5000

CMD ["pnpm", "start"]
