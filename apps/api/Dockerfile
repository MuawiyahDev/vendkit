# syntax=docker/dockerfile:1

FROM node:24-alpine AS base
RUN corepack enable && apk add --no-cache openssl
WORKDIR /app

# Prisma generate runs during install and only needs a syntactically valid URL.
ENV DATABASE_URL=postgresql://build:build@localhost:5432/build

# Workspace manifests are copied first so dependency installation is cached.
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json .npmrc ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY packages/database/package.json packages/database/
COPY packages/eslint-config/package.json packages/eslint-config/
COPY packages/typescript-config/package.json packages/typescript-config/
COPY packages/ui/package.json packages/ui/

# Prisma's postinstall hook needs the schema during dependency install.
COPY packages/database/prisma packages/database/prisma
COPY packages/database/prisma.config.ts packages/database/

RUN pnpm install --frozen-lockfile

COPY packages/database packages/database
COPY apps/api apps/api

RUN pnpm --filter @repo/database build \
  && pnpm --filter api build

ENV NODE_ENV=production
ENV PORT=4000
EXPOSE 4000

# Migrations run at startup so a fresh volume is ready on first boot. The
# command is safe to repeat: applied migrations are skipped.
CMD ["sh", "-c", "pnpm --filter @repo/database exec prisma migrate deploy && node apps/api/dist/main.js"]
