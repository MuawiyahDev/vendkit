"use client";

import { DatabaseBackup, RefreshCw } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { BackupSummary } from "../backups.types";
import { BackupHistoryTable } from "./backup-history-table";

interface BackupHistorySectionProps {
  backups: BackupSummary[];
  busy: boolean;
  isCreating: boolean;
  onRestore: (backup: BackupSummary) => void;
  onDelete: (backup: BackupSummary) => void;
  onRefresh: () => void;
  onCreate: () => void;
}

export function BackupHistorySection({
  backups,
  busy,
  isCreating,
  onRestore,
  onDelete,
  onRefresh,
  onCreate,
}: BackupHistorySectionProps) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold tracking-tight">
            Backup history
          </h3>
          <p className="text-muted-foreground mt-0.5 text-xs">
            Archived files remain on this server until you delete them.
          </p>
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={onRefresh}>
          <RefreshCw aria-hidden="true" />
          Refresh
        </Button>
      </div>

      {backups.length === 0 ? (
        <EmptyState
          icon={DatabaseBackup}
          title="No backups yet"
          description="Create a backup to protect your catalog, orders, customers, settings and media files."
        >
          <Button type="button" onClick={onCreate} disabled={busy}>
            <DatabaseBackup aria-hidden="true" />
            {isCreating ? "Starting…" : "Create backup"}
          </Button>
        </EmptyState>
      ) : (
        <Card className="overflow-hidden py-0">
          <BackupHistoryTable
            backups={backups}
            busy={busy}
            onRestore={onRestore}
            onDelete={onDelete}
          />
        </Card>
      )}
    </section>
  );
}
