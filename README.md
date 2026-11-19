# VendKit

Self-hosted order management for social-commerce sellers. VendKit keeps
Facebook, Instagram, WhatsApp, and phone orders in one place: products,
customers, stock, payments, invoices, and backups — on your own server, with
no subscription.

## Features

- **Orders** — create, edit, cancel, filter, and search orders; record
  payments; track outstanding balances; record returns back into stock.
  Every order records its sales channel (Facebook, Instagram, WhatsApp,
  website, walk-in, and more), courier and tracking number, plus a full
  activity timeline from creation to delivery.
- **Invoices** — persistent, numbered invoices per order. Totals, business
  details, and terms are captured when the invoice is created, then rendered
  as a downloadable PDF. Drafts can be issued later; issued invoices can be
  cancelled without reusing numbers.
- **Products and catalog** — categories, brands, SKUs, images, and pricing.
- **Inventory** — stock tracking with an immutable movement history, low-stock
  alerts, and automatic deduction when orders are placed.
- **Customers** — addresses, notes, full order history, and phone-based
  duplicate detection when a number is already saved.
- **Reports** — revenue, orders, average order value, status and channel
  breakdowns, daily sales, top products, and top customers for any date range.
- **CSV exports** — download filtered orders, customers, and inventory with
  spreadsheet-safe escaping.
- **Team** — administrators can create members and administrators, and reset
  passwords. Public sign-up is closed after the first account.
- **Media library** — upload, browse, and reuse product and branding images.
- **WhatsApp hand-off** — pre-filled order messages you can send to a customer
  from the order page.
- **Dashboard** — revenue, order status, best sellers, stock alerts, and a
  setup checklist driven by real progress.
- **Settings** — business profile, invoice branding and numbering, regional
  formats, tax, order defaults, payments, shipping, and notifications.
- **Backup and restore** — download a complete archive of business data and
  media, and restore it later. Invoices are included.

## Requirements

- Node.js 24+
- pnpm 11+
- PostgreSQL 16+ (or Docker)

## Quick start with Docker

1. Copy the environment template and set real secrets:

   ```sh
   cp .env.example .env
   openssl rand -hex 32   # JWT_SECRET
   openssl rand -hex 32   # API_KEY
   ```

2. Start the stack:

   ```sh
   docker compose up -d --build
   ```

3. Open <http://localhost:3000>. The first account you create becomes the
   administrator. After that, public registration is closed by default.

Database migrations run automatically when the API container starts. Business
data is stored in the `vendkit-db` volume; uploaded images and backups are
stored in `vendkit-data`.

To upgrade:

```sh
git pull
docker compose up -d --build
```

## Local development

```sh
pnpm install
cp apps/api/.env.example apps/api/.env
cp packages/database/.env.example packages/database/.env
cp apps/web/.env.example apps/web/.env
```

Set the same `API_KEY` in `apps/api/.env` and `apps/web/.env`, then:

```sh
pnpm db:migrate
pnpm dev
```

- Web app: <http://localhost:3000>
- API: <http://localhost:4000/api>
- Health check: <http://localhost:4000/api/health>

## First run

1. Open `/sign-up` and create the first account. It is created as an
   **administrator**.
2. Open **Settings → Business profile** and fill in the details that appear on
   invoices.
3. Open **Settings → Invoice** to choose numbering, currency display, due
   period, default status, and terms.
4. Add categories, brands, and products before creating orders.

Public registration stays closed after the first account. Set
`ALLOW_PUBLIC_REGISTRATION=true` only if you intentionally want self-service
sign-up. Administrators can create members, choose their role, and reset their
passwords from **Team** in the sidebar.

## Environment variables

### API (`apps/api/.env`)

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | yes | PostgreSQL connection string. |
| `JWT_SECRET` | yes | Access-token signing secret (32+ characters). |
| `API_KEY` | yes | Shared key used by the web app to call the API. |
| `PORT` | no | API port. Default `4000`. |
| `CORS_ORIGINS` | in production | Comma-separated allowed web origins. |
| `ALLOW_PUBLIC_REGISTRATION` | no | Allow sign-up after the first account. Default `false`. |
| `IMAGE_STORAGE_DIR` | no | Image upload directory. |
| `BACKUP_STORAGE_DIR` | no | Backup archive directory. |
| `IMAGE_MAX_FILE_SIZE` | no | Max image size in bytes. Default 5 MB. |
| `BACKUP_MAX_FILE_SIZE` | no | Max backup upload size. Default 1 GB. |
| `BACKUP_SAFETY_SNAPSHOT` | no | Snapshot before restore. Default `true`. |

The API validates these at startup and refuses to boot with a message listing
every problem.

### Web (`apps/web/.env`)

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEST_API_URL` | yes | API base URL, including `/api`. |
| `API_KEY` | yes | Must match the API's `API_KEY`. |

Invoice business details, numbering, and terms are **not** environment
variables: they live in **Settings** and are stored in the database.

## Scripts

| Command | Description |
| --- | --- |
| `pnpm dev` | Run web and API in watch mode. |
| `pnpm build` | Build all apps and packages. |
| `pnpm lint` | Lint the workspace. |
| `pnpm check-types` | Type-check the workspace. |
| `pnpm test` | Run unit tests. |
| `pnpm db:migrate` | Create/apply a development migration. |
| `pnpm db:deploy` | Apply existing migrations (production). |
| `pnpm db:studio` | Open Prisma Studio. |

## Backups

Backups are managed from **Settings → Backup & Restore**. An archive contains
the business data (catalog, customers, orders, payments, invoices, inventory
history, and settings) plus uploaded media. Users, sessions, and backup history
are intentionally excluded so they survive a restore.

Restores are transactional: if anything fails, the existing data is left
untouched. With `BACKUP_SAFETY_SNAPSHOT=true`, a safety backup is created before
the restore begins.

Keep the `BACKUP_STORAGE_DIR` volume on durable storage, and copy archives off
the server as part of your host backup routine.

## Deployment notes

- Put the web app behind HTTPS (a reverse proxy such as Caddy, nginx, or
  Traefik). Session cookies are marked `Secure` in production, so plain HTTP
  will not sign users in.
- Set `CORS_ORIGINS` (API) to the public web URL.
- Do not expose the API port publicly; the browser should only talk to the web
  app, which proxies API calls server-to-server with `API_KEY`.
- Run one API instance. Authentication rate limiting is in-memory and applies
  per process.

## Project structure

```
apps/web          Next.js frontend and server-side API proxy
apps/api          NestJS API, business logic, invoices, backups
packages/database Prisma schema, migrations, and generated client
packages/ui       Shared UI package
docs              Operational documentation
```

## License

See [LICENSE](LICENSE).
