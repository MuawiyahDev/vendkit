# Contributing to VendKit

Thanks for helping improve VendKit. This project is a self-hosted order
manager for small social-commerce sellers, and contributions should keep it
simple, reliable, and easy to operate.

## Before you start

- Read [AGENTS.md](AGENTS.md) for the project's architecture and coding rules.
- Check existing issues and pull requests before starting significant work.
- For large features, open an issue first so scope can be agreed on.
- Report security issues privately as described in [SECURITY.md](SECURITY.md).

## Development setup

Requirements: Node.js 24+, pnpm 11+, and PostgreSQL 16+.

```sh
pnpm install
cp apps/api/.env.example apps/api/.env
cp packages/database/.env.example packages/database/.env
cp apps/web/.env.example apps/web/.env
pnpm db:migrate
pnpm dev
```

Set the same `API_KEY` in `apps/api/.env` and `apps/web/.env`. The web app runs
on <http://localhost:3000> and the API on <http://localhost:4000/api>.

## Checks

Run these before opening a pull request:

```sh
pnpm lint
pnpm check-types
pnpm test
pnpm build
```

Add or update tests for business logic, validation, authorization, and error
paths. Do not change tests only to make an incorrect implementation pass.

## Conventions

- Use TypeScript strict mode and avoid `any`.
- Follow the existing module structure and keep controllers, services, DTOs,
  mappers, constants, and pure utilities in their established files.
- Use Prisma migrations for schema changes and commit both the schema and
  migration.
- Use Conventional Commits, for example `feat(api): add product endpoints` or
  `fix(web): correct mobile layout`.
- Keep pull requests focused. Do not include unrelated refactors or formatting
  churn.

## Product scope

VendKit intentionally targets a single self-hosted business. Do not add
multi-tenancy, customer storefronts, payment gateways, courier or social APIs,
AI order parsing, subscription billing, or complex permission systems unless
the scope has been explicitly agreed in an issue.

## Database changes

- Use `pnpm db:migrate` for development migrations.
- Never rewrite migration history that has already been shared.
- Include indexes and constraints required by the new query patterns.
- Verify backup and restore compatibility when adding or changing models.

## Pull requests

Describe what changed, why it is needed, and how it was verified. Include
screenshots for UI changes and note any behavior that could not be tested
locally.
