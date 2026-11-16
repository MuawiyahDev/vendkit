import type {
  BackupCounts,
  BackupStatus,
  BackupSummary,
  RestoreStatus,
} from "../backups.types";

const byteFormatter = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 1,
});

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) {
    return "—";
  }
  if (bytes === 0) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB", "TB"];
  let value = bytes;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  const formatted = byteFormatter.format(value);
  return `${formatted} ${units[unitIndex]}`;
}

export function findLastCompletedBackup(
  backups: BackupSummary[],
): BackupSummary | null {
  return (
    backups.find(
      (backup) => backup.status === "COMPLETED" && backup.kind === "MANUAL",
    ) ??
    backups.find((backup) => backup.status === "COMPLETED") ??
    null
  );
}

export function backupStatusLabel(status: BackupStatus): string {
  switch (status) {
    case "IN_PROGRESS":
      return "Creating";
    case "COMPLETED":
      return "Ready";
    case "FAILED":
      return "Failed";
  }
}

export function restoreStatusLabel(status: RestoreStatus): string {
  switch (status) {
    case "IN_PROGRESS":
      return "Restoring";
    case "COMPLETED":
      return "Restored";
    case "FAILED":
      return "Failed";
  }
}

export function totalRecords(counts: BackupCounts | null): number | null {
  if (!counts?.totalRecords || counts.totalRecords <= 0) {
    return null;
  }
  return counts.totalRecords;
}

export const INCLUDED_DATA_GROUPS = [
  {
    title: "Catalog",
    description: "Products, categories, brands, images and product media.",
  },
  {
    title: "Sales",
    description: "Customers, orders, line items and payment records.",
  },
  {
    title: "Configuration",
    description:
      "Business profile, invoice, regional, tax, order, payment, shipping and notification settings.",
  },
  {
    title: "Documents",
    description: "Invoice and order document sequences.",
  },
  {
    title: "Media library",
    description: "Every uploaded image file, not only the database reference.",
  },
] as const;
