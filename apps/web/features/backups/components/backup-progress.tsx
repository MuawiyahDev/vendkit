interface BackupProgressProps {
  label: string;
  progress: number;
  detail?: string;
}

export function BackupProgress({
  label,
  progress,
  detail,
}: BackupProgressProps) {
  const value = Math.min(100, Math.max(0, Math.round(progress)));

  return (
    <div className="flex flex-col gap-2" role="status" aria-live="polite">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground tabular-nums">{value}%</span>
      </div>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={value}
        className="bg-surface-muted h-1.5 w-full overflow-hidden rounded-full"
      >
        <div
          className="bg-primary h-full rounded-full transition-[width] duration-500 ease-out motion-reduce:transition-none"
          style={{ width: `${value}%` }}
        />
      </div>
      {detail ? (
        <p className="text-muted-foreground text-xs leading-relaxed">
          {detail}
        </p>
      ) : null}
    </div>
  );
}
