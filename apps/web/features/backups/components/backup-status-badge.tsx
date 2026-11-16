import { Badge } from "@/components/ui/badge";
import type { BackupStatus, RestoreStatus } from "../backups.types";
import { backupStatusLabel, restoreStatusLabel } from "../utils/backups.utils";

export function BackupStatusBadge({ status }: { status: BackupStatus }) {
  const variant =
    status === "COMPLETED"
      ? "success"
      : status === "FAILED"
        ? "destructive"
        : "info";

  return (
    <Badge variant={variant} dot>
      {backupStatusLabel(status)}
    </Badge>
  );
}

export function RestoreStatusBadge({ status }: { status: RestoreStatus }) {
  const variant =
    status === "COMPLETED"
      ? "success"
      : status === "FAILED"
        ? "destructive"
        : "info";

  return (
    <Badge variant={variant} dot>
      {restoreStatusLabel(status)}
    </Badge>
  );
}
