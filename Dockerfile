FROM node:16.13 as builder
WORKDIR /app

RUN npm i -g pnpm

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./

COPY signaling-server/package.json signaling-server/tsconfig.json signaling-server/
COPY protocols/package.json protocols/tsconfig.json protocols/

RUN pnpm install --frozen-lockfile

COPY signaling-server/src signaling-server/src/
COPY protocols/src protocols/src/

RUN pnpm build

# === PROD ===

FROM node:16.13-alpine
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/ ./

CMD node signaling-server/dist/index.js
