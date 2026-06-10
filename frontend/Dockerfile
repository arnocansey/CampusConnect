FROM node:18-alpine

RUN corepack enable && corepack prepare pnpm@8 --activate

WORKDIR /app

COPY package.json ./

RUN pnpm install

COPY . .

RUN pnpm run build

EXPOSE 3000

CMD ["pnpm", "start"]
