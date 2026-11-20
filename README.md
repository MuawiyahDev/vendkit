<div align="center">

# VendKit

**Self-hosted order management for social-commerce sellers.**

Products, customers, orders, payments, invoices, inventory, reports, and backups — in one calm workspace you own.

[![CI](https://github.com/MuawiyahDev/open-order/actions/workflows/ci.yml/badge.svg)](https://github.com/MuawiyahDev/open-order/actions/workflows/ci.yml)
[![License: AGPL-3.0](https://img.shields.io/badge/license-AGPL--3.0-blue.svg)](LICENSE)
[![Node.js 24+](https://img.shields.io/badge/node-%3E%3D24-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![Docker Compose](https://img.shields.io/badge/docker-compose-2496ED?logo=docker&logoColor=white)](docker-compose.yml)

[Why VendKit](#why-vendkit) · [Screens](#screens) · [Features](#features) · [Quick start](#quick-start-with-docker) · [Configuration](#configuration) · [Deployment](#deployment)

</div>

<img src="docs/screenshots/dashboard.png" alt="VendKit dashboard showing revenue, orders, best-selling products, recent orders, and low-stock alerts" width="100%">

<p align="center"><sub>The dashboard at a glance: revenue, order volume, best sellers, recent sales, and stock alerts for the selected period.</sub></p>

## Why VendKit

Most social sellers run their business across Facebook, Instagram, WhatsApp, and phone messages. Orders live in chats, stock lives in a notebook, and invoices are rebuilt by hand.

VendKit brings that work into one place:

- **Own your data.** Run it on your own server, with your own database, files, and backups. No subscription and no vendor lock-in.
- **Built for messaging-first selling.** Every order records its channel, courier, tracking number, customer notes, and a full activity timeline.
- **Operational, not accounting.** VendKit handles the daily work of selling: stock, payments, invoices, delivery, and follow-up.
- **Simple to run.** One web app, one API, PostgreSQL, and Docker Compose. No microservices and no multi-tenant control plane.

VendKit is designed for a **single business per installation**. It is intentionally focused: no storefront, no customer accounts, no courier APIs, and no payment-gateway integrations.

## Screens

All screenshots use a fictional demo store, **Nova Living**, seeded with realistic products, customers, orders, payments, and invoices.

### Orders

<table>
  <tr>
    <td width="100%">
      <img src="docs/screenshots/orders.png" alt="Orders list with search, status filters, payment status, channel, and totals" width="100%">
      <br>
      <sub><strong>Orders</strong> — search, filter by status, payment, channel, or date, and export the current view to CSV.</sub>
    </td>
  </tr>
</table>

<table>
  <tr>
    <td width="50%" valign="top">
      <img src="docs/screenshots/order-detail.png" alt="Order detail page with items, payments, invoice, activity timeline, customer details, and notes" width="100%">
      <br>
      <sub><strong>Order detail</strong> — items, payments, invoice, delivery details, notes, and an immutable activity timeline.</sub>
    </td>
    <td width="50%" valign="top">
      <img src="docs/screenshots/order-edit.png" alt="Order editor with customer, product lines, channel, delivery details, notes, and live totals" width="100%">
      <br>
      <sub><strong>Order editor</strong> — change products, quantities, shipping, channel, and notes with stock adjustments applied automatically.</sub>
    </td>
  </tr>
</table>

### Catalog

<table>
  <tr>
    <td width="100%">
      <img src="docs/screenshots/products.png" alt="Product catalog with images, SKUs, categories, brands, prices, and stock" width="100%">
      <br>
      <sub><strong>Products</strong> — a visual catalog with SKUs, pricing, categories, brands, images, and stock status.</sub>
    </td>
  </tr>
</table>

<table>
  <tr>
    <td width="50%" valign="top">
      <img src="docs/screenshots/product-edit.png" alt="Product editor with pricing, inventory, images, and a live summary preview" width="100%">
      <br>
      <sub><strong>Product editor</strong> — pricing, inventory rules, dimensions, images, and a live preview.</sub>
    </td>
    <td width="50%" valign="top">
      <img src="docs/screenshots/categories.png" alt="Category management with search, status, and creation dates" width="100%">
      <br>
      <sub><strong>Categories</strong> — organize the catalog and control which categories are active.</sub>
    </td>
  </tr>
</table>

<table>
  <tr>
    <td width="50%" valign="top">
      <img src="docs/screenshots/brands.png" alt="Brand management with search, status, and creation dates" width="100%">
      <br>
      <sub><strong>Brands</strong> — group products by supplier or label.</sub>
    </td>
    <td width="50%" valign="top">
      <img src="docs/screenshots/media.png" alt="Media library with image thumbnails, storage stats, file types, and search" width="100%">
      <br>
      <sub><strong>Media library</strong> — upload once and reuse images across products and business branding.</sub>
    </td>
  </tr>
</table>

### Customers and inventory

<table>
  <tr>
    <td width="50%" valign="top">
      <img src="docs/screenshots/customers.png" alt="Customer directory with contact details, order counts, and duplicate-phone warnings" width="100%">
      <br>
      <sub><strong>Customers</strong> — contact details, order history, and duplicate-phone detection.</sub>
    </td>
    <td width="50%" valign="top">
      <img src="docs/screenshots/customer-detail.png" alt="Customer detail page with contact information, notes, and full order history" width="100%">
      <br>
      <sub><strong>Customer detail</strong> — saved addresses, notes, and every order in one place.</sub>
    </td>
  </tr>
</table>

<img src="docs/screenshots/inventory.png" alt="Inventory page with stock levels, low-stock alerts, movement history, and CSV export" width="100%">

<p align="center"><sub><strong>Inventory</strong> — tracked stock, low-stock thresholds, and an auditable movement history.</sub></p>

### Invoices and reports

<img src="docs/screenshots/invoices.png" alt="Invoice list with invoice numbers, linked orders, customers, issue dates, totals, statuses, and PDF downloads" width="100%">

<p align="center"><sub><strong>Invoices</strong> — numbered documents linked to orders, with draft, issued, and cancelled states.</sub></p>

<img src="docs/screenshots/reports.png" alt="Reports page with revenue KPIs, a sales chart, status and channel breakdowns, top products, and top customers" width="100%">

<p align="center"><sub><strong>Reports</strong> — revenue, order value, status and channel mix, daily sales, top products, and top customers.</sub></p>

### Settings

The settings area covers business identity, invoice branding and numbering, regional formats, tax, order defaults, payments, shipping, notifications, and backups.

<img src="docs/screenshots/settings.png" alt="Settings overview with business profile navigation and business identity fields" width="100%">

<table>
  <tr>
    <td width="50%" valign="top">
      <img src="docs/screenshots/settings-business-profile.png" alt="Business profile settings with logo, contact details, registration information, and address" width="100%">
      <br>
      <sub><strong>Business profile</strong> — the identity and address printed on documents.</sub>
    </td>
    <td width="50%" valign="top">
      <img src="docs/screenshots/settings-invoice.png" alt="Invoice settings with numbering, defaults, behavior, and a live invoice preview" width="100%">
      <br>
      <sub><strong>Invoice</strong> — numbering, terms, display options, and a live preview.</sub>
    </td>
  </tr>
  <tr>
    <td width="50%" valign="top">
      <img src="docs/screenshots/settings-regional.png" alt="Regional settings for currency, separators, country, timezone, language, and date formats" width="100%">
      <br>
      <sub><strong>Regional</strong> — currency, timezone, language, and date formats.</sub>
    </td>
    <td width="50%" valign="top">
      <img src="docs/screenshots/settings-tax.png" alt="Tax settings with default rate, pricing mode, tax ID, and a calculation example" width="100%">
      <br>
      <sub><strong>Tax</strong> — default rate, inclusive or exclusive pricing, and invoice presentation.</sub>
    </td>
  </tr>
  <tr>
    <td width="50%" valign="top">
      <img src="docs/screenshots/settings-order.png" alt="Order settings with numbering, default status, notes, and editing rules" width="100%">
      <br>
      <sub><strong>Orders</strong> — numbering, defaults, and editing rules for new orders.</sub>
    </td>
    <td width="50%" valign="top">
      <img src="docs/screenshots/settings-payment.png" alt="Payment settings with enabled methods, default method, bank details, and terms" width="100%">
      <br>
      <sub><strong>Payments</strong> — accepted methods, bank details, and payment terms.</sub>
    </td>
  </tr>
  <tr>
    <td width="50%" valign="top">
      <img src="docs/screenshots/settings-shipping.png" alt="Shipping settings with default charge, free-shipping threshold, and delivery instructions" width="100%">
      <br>
      <sub><strong>Shipping</strong> — default charges, free-shipping thresholds, and delivery instructions.</sub>
    </td>
    <td width="50%" valign="top">
      <img src="docs/screenshots/settings-notification.png" alt="Notification settings with business email, sender details, and event preferences" width="100%">
      <br>
      <sub><strong>Notifications</strong> — business notification preferences and sender details.</sub>
    </td>
  </tr>
</table>

<img src="docs/screenshots/settings-backup.png" alt="Backup and restore page with backup creation, restore warnings, and included data" width="100%">

<p align="center"><sub><strong>Backup &amp; restore</strong> — download a complete archive of business data and media, or restore a previous backup.</sub></p>

### Team and account

<table>
  <tr>
    <td width="50%" valign="top">
      <img src="docs/screenshots/team.png" alt="Team page with administrator and member accounts, roles, join dates, and password resets" width="100%">
      <br>
      <sub><strong>Team</strong> — separate sign-ins for the people who help run the business.</sub>
    </td>
    <td width="50%" valign="top">
      <img src="docs/screenshots/account.png" alt="Account page with profile name and password change forms" width="100%">
      <br>
      <sub><strong>Account</strong> — update your profile and change your password.</sub>
    </td>
  </tr>
</table>

### Authentication

<table>
  <tr>
    <td width="50%" valign="top">
      <img src="docs/screenshots/sign-in.png" alt="VendKit sign-in page" width="100%">
      <br>
      <sub><strong>Sign in</strong> — secure access to the workspace.</sub>
    </td>
    <td width="50%" valign="top">
      <img src="docs/screenshots/sign-up.png" alt="VendKit first-run account creation page" width="100%">
      <br>
      <sub><strong>First run</strong> — the first account becomes the administrator; public sign-up then closes.</sub>
    </td>
  </tr>
</table>

## Features

### Selling

- **Orders** — create, edit, cancel, search, filter, and export orders. Track outstanding balances, record payments, and process returns back into stock.
- **Sales channels** — record where each order came from: Facebook, Instagram, WhatsApp, TikTok, website, phone, walk-in, or other.
- **Delivery tracking** — capture the courier and tracking number, and follow the order through a full activity timeline.
- **Payments** — record cash, bank transfer, mobile financial service, card, or other payments. Payment status is derived from recorded payments.
- **Invoices** — one numbered invoice per order, with configurable numbering, business details, terms, and a downloadable PDF. Drafts can be issued later; issued invoices can be cancelled without reusing numbers.
- **WhatsApp hand-off** — generate a pre-filled order message and open it in WhatsApp. VendKit does not use the WhatsApp Business API.

### Catalog and stock

- **Products** — SKUs, pricing, compare-at prices, descriptions, dimensions, units, images, categories, and brands.
- **Inventory** — stock tracking with an immutable movement history, low-stock thresholds, automatic deduction when orders are placed, and stock restoration on cancellation, return, or deletion.
- **Media library** — upload images once, reuse them across products, and keep usage protection when an image is attached to a product or the business profile.
- **Categories and brands** — organize the catalog and control what is active.

### Customers and insight

- **Customers** — contact details, addresses, notes, full order history, and phone-based duplicate detection when a number is already saved.
- **Dashboard** — revenue, orders, average order value, new customers, order status, best sellers, recent orders, stock alerts, and a setup checklist driven by real data.
- **Reports** — revenue, orders, average order value, status and channel breakdowns, daily sales, top products, and top customers for a selected date range.
- **CSV exports** — download filtered orders, customers, and inventory with spreadsheet-safe escaping.

### Administration

- **Team** — administrators can create members and administrators, and reset passwords. The first account becomes the administrator.
- **Account** — users can update their name and change their password.
- **Settings** — business profile, invoice, regional, tax, order, payment, shipping, and notification defaults, all stored in the database.
- **Backup and restore** — create a complete archive of catalog, customers, orders, payments, invoices, inventory history, settings, and media. Restores are transactional and optionally create a safety backup first.
- **Health check** — `GET /api/health` reports API and database status for containers and monitoring.

## Technology

| Layer          | Stack                                                                      |
| -------------- | -------------------------------------------------------------------------- |
| Monorepo       | pnpm workspaces, Turborepo                                                 |
| Frontend       | Next.js, React, TypeScript, Tailwind CSS, shadcn/ui, React Hook Form, Zod  |
| Backend        | NestJS, TypeScript, class-validator                                        |
| Database       | PostgreSQL, Prisma ORM                                                     |
| Authentication | JWT access tokens, refresh cookies, bcrypt password hashing, rate limiting |
| Documents      | React PDF for invoice PDFs                                                 |
| Deployment     | Docker, Docker Compose, GitHub Actions CI                                  |

The browser talks only to the Next.js app. Server-side route handlers proxy requests to NestJS with a shared API key, so the API does not need to be publicly exposed.

## Quick start with Docker

### Requirements

- Docker with the Compose plugin
- A server or local machine with a persistent disk

### 1. Configure

```sh
cp .env.example .env
```

Edit `.env` and set at least:

```sh
POSTGRES_PASSWORD=use-a-long-url-safe-password
JWT_SECRET=...
API_KEY=...
APP_URL=http://localhost:3000
```

Generate the two secrets with:

```sh
openssl rand -hex 32
```

Use a different value for `JWT_SECRET` and `API_KEY`. `POSTGRES_PASSWORD` should contain only URL-safe characters because it is embedded in the API connection string.

### 2. Start

```sh
docker compose up -d --build
```

Open <http://localhost:3000> and create the first account. It becomes the administrator.

Database migrations run automatically when the API container starts. Business data is stored in the `vendkit-db` volume; uploaded images and backups are stored in `vendkit-data`.

### 3. Upgrade

```sh
git pull
docker compose up -d --build
```

Applied migrations are skipped, so the command is safe to repeat.

## Local development

### Requirements

- Node.js 24+
- pnpm 11+
- PostgreSQL 16+

Create the database and copy the environment templates:

```sh
createdb vendkit

pnpm install

cp apps/api/.env.example apps/api/.env
cp packages/database/.env.example packages/database/.env
cp apps/web/.env.example apps/web/.env
```

Set the same `DATABASE_URL` in `apps/api/.env` and `packages/database/.env`, and set the same `API_KEY` in `apps/api/.env` and `apps/web/.env`.

Apply migrations and start both apps:

```sh
pnpm db:migrate
pnpm dev
```

- Web app: <http://localhost:3000>
- API: <http://localhost:4000/api>
- Health check: <http://localhost:4000/api/health>

## First run

1. Open `/sign-up` and create the first account. It is created as an **administrator**.
2. Open **Settings → Business profile** and add the details that appear on invoices.
3. Open **Settings → Invoice** to choose numbering, currency display, due period, default status, and terms.
4. Add categories, brands, and products before creating orders.
5. Use the dashboard setup checklist to confirm the core pieces are in place.

Public registration is closed after the first account. Set `ALLOW_PUBLIC_REGISTRATION=true` only if you intentionally want self-service sign-up. Administrators can create members and administrators, and reset passwords from **Team**.

## Configuration

The API validates required environment variables at startup and refuses to boot with a message listing every problem.

### API

| Variable                                | Required      | Purpose                                                 |
| --------------------------------------- | ------------- | ------------------------------------------------------- |
| `DATABASE_URL`                          | yes           | PostgreSQL connection string.                           |
| `JWT_SECRET`                            | yes           | Access-token signing secret, at least 32 characters.    |
| `API_KEY`                               | yes           | Shared key used by the web app to call the API.         |
| `PORT`                                  | no            | API port. Default `4000`.                               |
| `CORS_ORIGINS`                          | in production | Comma-separated allowed web origins.                    |
| `ALLOW_PUBLIC_REGISTRATION`             | no            | Allow sign-up after the first account. Default `false`. |
| `IMAGE_STORAGE_DIR`                     | no            | Image upload directory. Default `uploads/images`.       |
| `IMAGE_MAX_FILE_SIZE`                   | no            | Maximum image upload size in bytes. Default 5 MB.       |
| `BACKUP_STORAGE_DIR`                    | no            | Backup archive directory. Default `uploads/backups`.    |
| `BACKUP_MAX_FILE_SIZE`                  | no            | Maximum backup upload size. Default 1 GB.               |
| `BACKUP_MAX_EXTRACTED_SIZE`             | no            | Maximum uncompressed restore size. Default 2 GB.        |
| `BACKUP_RESTORE_TRANSACTION_TIMEOUT_MS` | no            | Restore transaction timeout. Default 10 minutes.        |
| `BACKUP_SAFETY_SNAPSHOT`                | no            | Create a safety backup before restore. Default `true`.  |
| `APP_VERSION`                           | no            | Version recorded in backup metadata.                    |

### Web

| Variable       | Required | Purpose                         |
| -------------- | -------- | ------------------------------- |
| `NEST_API_URL` | yes      | API base URL, including `/api`. |
| `API_KEY`      | yes      | Must match the API's `API_KEY`. |

Business details, invoice numbering, and terms are **not** environment variables. They live in **Settings** and are stored in the database, so they are included in backups.

## Scripts

| Command            | Description                              |
| ------------------ | ---------------------------------------- |
| `pnpm dev`         | Run the web app and API in watch mode.   |
| `pnpm build`       | Build all apps and packages.             |
| `pnpm lint`        | Lint the workspace.                      |
| `pnpm check-types` | Type-check the workspace.                |
| `pnpm test`        | Run unit tests.                          |
| `pnpm db:generate` | Regenerate the Prisma client.            |
| `pnpm db:migrate`  | Create or apply a development migration. |
| `pnpm db:deploy`   | Apply existing migrations in production. |
| `pnpm db:studio`   | Open Prisma Studio.                      |

CI runs linting, type-checking, API and web tests, the production build, Compose validation, and Docker image builds.

## Backups

Backups are managed from **Settings → Backup & Restore**.

An archive contains:

- catalog, categories, brands, images, and product media
- customers, orders, order items, payments, and returns
- invoices and document sequences
- inventory movements and settings

Users, sessions, and backup history are intentionally excluded so they survive a restore.

Restores are transactional: if anything fails, existing data is left untouched. With `BACKUP_SAFETY_SNAPSHOT=true`, a safety backup is created before the restore begins.

Keep `BACKUP_STORAGE_DIR` on durable storage, and copy archives off the server as part of your host backup routine. A backup on the same disk as the database is not a disaster-recovery plan.

## Deployment

- **Use HTTPS.** Session cookies are marked `Secure` in production, so plain HTTP will not sign users in. Put the web app behind a reverse proxy such as Caddy, nginx, or Traefik.
- **Set `APP_URL`** to the public web URL. Compose passes it to the API as `CORS_ORIGINS`.
- **Do not expose the API port publicly.** The browser should talk only to the web app, which proxies API calls server-to-server with `API_KEY`.
- **Run one API instance.** Authentication rate limiting is in-memory and applies per process.
- **Persist both volumes.** `vendkit-db` holds PostgreSQL data; `vendkit-data` holds uploaded images and backup archives.
- **Back up off the server.** Download backups regularly or copy the backup volume to durable off-host storage.

### Verify a deployment

After the stack starts:

1. Confirm both containers are healthy with `docker compose ps`.
2. Confirm the API health check with `docker compose exec api wget -qO- http://localhost:4000/api/health`.
3. Create the first account and complete the dashboard setup checklist.
4. Create a product, customer, and order, then download an invoice PDF.
5. Download a backup, restore it, and confirm the order and invoice still load.

## Project structure

```text
apps/web            Next.js frontend and server-side API proxy
apps/api            NestJS API, business logic, invoices, and backups
packages/database   Prisma schema, migrations, and generated client
packages/ui         Shared UI primitives
docs                Operational documentation and screenshots
```

## Scope

VendKit is intentionally a focused, single-business application. It does not include:

- multi-tenancy or a hosted SaaS control plane
- customer-facing accounts or storefronts
- official WhatsApp, Facebook, or Instagram API integrations
- courier or payment-gateway integrations
- AI order parsing or offline-first sync

Notifications are configuration-only in this release: preferences are saved, but email delivery is not connected. Use the WhatsApp hand-off on an order to contact the customer directly.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for local setup, checks, and coding conventions.

Report security issues privately as described in [SECURITY.md](SECURITY.md). Please do not open a public issue for a vulnerability.

## License

VendKit is licensed under the [GNU Affero General Public License v3.0](LICENSE).

If you run a modified version as a network service, the AGPL requires you to offer its source code to the people using it.
