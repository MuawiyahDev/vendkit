"use client";

import { Download, RotateCcw, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateTime } from "@/lib/format";
import { backupDownloadUrl } from "../api/backups-api";
import type { BackupSummary } from "../backups.types";
import { formatBytes, totalRecords } from "../utils/backups.utils";
import { BackupStatusBadge } from "./backup-status-badge";
import { BackupProgress } from "./backup-progress";

interface BackupHistoryTableProps {
  backups: BackupSummary[];
  busy: boolean;
  onRestore: (backup: BackupSummary) => void;
  onDelete: (backup: BackupSummary) => void;
}

export function BackupHistoryTable({
  backups,
  busy,
  onRestore,
  onDelete,
}: BackupHistoryTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Backup</TableHead>
          <TableHead>Created</TableHead>
          <TableHead>Size</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {backups.map((backup) => {
          const records = totalRecords(backup.counts);

          return (
            <TableRow key={backup.id}>
              <TableCell className="max-w-[22rem]">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">
                      {backup.fileName}
                    </span>
                    {backup.kind === "PRE_RESTORE" ? (
                      <Badge variant="secondary" className="shrink-0">
                        Safety
                      </Badge>
                    ) : null}
                  </div>
                  <p className="text-muted-foreground text-xs">
                    Format v{backup.formatVersion} · VendKit {backup.appVersion}
                    {records ? ` · ${records.toLocaleString()} records` : ""}
                  </p>
                  {backup.status === "FAILED" && backup.errorMessage ? (
                    <p className="text-destructive-soft-foreground max-w-md text-xs leading-relaxed">
                      {backup.errorMessage}
                    </p>
                  ) : null}
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {formatDateTime(backup.createdAt)}
              </TableCell>
              <TableCell className="text-muted-foreground text-sm tabular-nums">
                {formatBytes(Number(backup.sizeBytes))}
              </TableCell>
              <TableCell className="min-w-36">
                {backup.status === "IN_PROGRESS" ? (
                  <BackupProgress
                    label="Creating backup"
                    progress={backup.progress}
                  />
                ) : (
                  <BackupStatusBadge status={backup.status} />
                )}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1">
                  {backup.status === "COMPLETED" ? (
                    <Button asChild variant="ghost" size="xs">
                      <a
                        href={backupDownloadUrl(backup.id)}
                        download
                        aria-label={`Download ${backup.fileName}`}
                      >
                        <Download aria-hidden="true" />
                        <span className="hidden sm:inline">Download</span>
                      </a>
                    </Button>
                  ) : (
                    <Button variant="ghost" size="xs" disabled>
                      <Download aria-hidden="true" />
                      <span className="hidden sm:inline">Download</span>
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="xs"
                    disabled={busy || backup.status !== "COMPLETED"}
                    onClick={() => onRestore(backup)}
                  >
                    <RotateCcw aria-hidden="true" />
                    <span className="hidden sm:inline">Restore</span>
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    className="text-muted-foreground hover:text-destructive-soft-foreground"
                    disabled={busy || backup.status === "IN_PROGRESS"}
                    onClick={() => onDelete(backup)}
                    aria-label={`Delete ${backup.fileName}`}
                  >
                    <Trash2 aria-hidden="true" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
