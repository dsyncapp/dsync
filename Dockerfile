FROM node:16.13 as builder
WORKDIR /app

RUN npm i -g pnpm

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY events/package.json events/tsconfig.json events/
COPY signaling-server/package.json signaling-server/tsconfig.json signaling-server/

RUN pnpm install --frozen-lockfile

COPY signaling-server/src signaling-server/src/
COPY events/src events/src/

RUN pnpm build

# === PROD ===

FROM node:16.13-alpine
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/ ./

CMD node signaling-server/dist/index.js
