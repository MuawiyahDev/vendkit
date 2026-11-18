# syntax=docker/dockerfile:1

FROM node:24-alpine AS base
RUN corepack enable
WORKDIR /app

# Prisma generate may run during install through workspace postinstall hooks.
ENV DATABASE_URL=postgresql://build:build@localhost:5432/build

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

COPY packages packages
COPY apps/web apps/web

RUN pnpm --filter web build

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

CMD ["pnpm", "--filter", "web", "start"]
