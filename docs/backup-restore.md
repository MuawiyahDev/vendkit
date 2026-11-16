# Backup & Restore

VendKit backups are self-contained, versioned archives written to the API
host's local filesystem. No cloud service or external database tool is used.

## Archive format

A backup is a gzip-compressed tar archive named
`vendkit-backup-<timestamp>.tar.gz`. It contains:

- `manifest.json` — backup format version, app version, creation time,
  included record counts, and a SHA-256 checksum for every entry.
- `data.json` — validated scalar rows for the business tables, with original
  identifiers, timestamps and decimal strings.
- `media/<storageKey>` — the original bytes of every uploaded image referenced
  by the database.

Rows are exported inside a PostgreSQL `REPEATABLE READ` transaction, so the
snapshot is consistent even while the dashboard is in use. A backup is only
marked successful after the archive has been completely written, flushed and
renamed into place. Partial archives are deleted.

### Included data

Categories, brands, images, products, product images, customers, orders, order
items, order payments, all singleton business settings, and document
sequences.

### Deliberately excluded

- User accounts, password hashes and refresh tokens. Restoring into a new
  installation keeps the current administrator account instead of replacing
  credentials from the archive.
- Backup and restore history, so the history survives a restore and parts of
  the database are not overwritten recursively.
- Environment variables, database URLs, JWT secrets, API keys and any other
  server configuration.

## Restore

The uploaded archive is streamed through gunzip and a strict tar reader. The
reader rejects absolute paths, `..` segments, backslashes, directories,
symlinks, PAX/GNU extensions, duplicate entries, oversized entries and data
after the archive footer. Media is extracted only under a temporary staging
directory using validated storage keys.

Before any current data is replaced:

1. The manifest format version must match the running application.
2. Every file checksum and media size is verified.
3. The table structure, field types, enum values and cross-table references are
   validated.
4. A safety backup of the current data is created when
   `BACKUP_SAFETY_SNAPSHOT=true` (the default).

The current media directory is moved aside, the validated media is moved into
place, and all business tables are replaced inside one serializable database
transaction. The restore job is marked completed inside that same transaction.
If anything fails, the transaction rolls back and the previous media directory
is restored. On startup, interrupted jobs are marked failed and media is
recovered from the deterministic safety directory.

Users and backup history are never deleted by a restore.

## Configuration

See `apps/api/.env.example`:

- `BACKUP_STORAGE_DIR` — archive directory. Must not be inside
  `IMAGE_STORAGE_DIR`.
- `BACKUP_MAX_FILE_SIZE` — maximum upload/archive size.
- `BACKUP_MAX_EXTRACTED_SIZE` — maximum uncompressed size accepted.
- `BACKUP_RESTORE_TRANSACTION_TIMEOUT_MS` — snapshot and restore timeout.
- `BACKUP_SAFETY_SNAPSHOT` — create a pre-restore safety backup.
- `APP_VERSION` — optional version recorded in backup metadata.

`BACKUP_STORAGE_DIR` must be writable by the API process and should be part of
the host's own disk/volume backup policy. The media directory must also be on
persistent storage.

## Operational notes

- Backup and restore jobs run in the API process and expose progress through
  the backup history endpoint. The in-process operation lock assumes a single
  API instance, which matches VendKit's self-hosted deployment model.
- There is no scheduler or background worker in the current deployment, so
  automatic backups are intentionally not implemented. Use the host's cron or
  a platform-level scheduler if scheduled archives are required.
- Restores should be performed during low traffic. Reads continue to work
  during the transaction, but new writes made during the swap window are not
  guaranteed to be preserved because the restored dataset replaces them.
- Very large datasets are serialized and validated in memory. The configured
  size limits are the control that prevents unbounded memory use.
- Archives contain customer contact details and business records. They are
  created with owner-only file permissions and downloaded only through the
  authenticated administrator API. Protect the storage host and any copies of
  downloaded archives accordingly.

## Testing

The restore end-to-end test replaces business data and is therefore opt-in.
Run it against an isolated PostgreSQL database:

```sh
RUN_BACKUP_RESTORE_E2E=1 \
DATABASE_URL=postgresql://user:password@localhost:5432/vendkit_backup_test \
pnpm --filter api test:e2e -- backups.e2e-spec.ts
```

