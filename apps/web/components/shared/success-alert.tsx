"use client";

import { useEffect, useRef } from "react";
import { CheckCircle2, X } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";

interface SuccessAlertProps {
  message: string;
  onDismiss: () => void;
  autoDismissMs?: number;
}

/**
 * Transient success feedback for completed mutations.
 * Announced politely to screen readers and auto-dismissed.
 */
export function SuccessAlert({
  message,
  onDismiss,
  autoDismissMs = 5000,
}: SuccessAlertProps) {
  const onDismissRef = useRef(onDismiss);

  useEffect(() => {
    onDismissRef.current = onDismiss;
  }, [onDismiss]);

  useEffect(() => {
    const timer = setTimeout(() => onDismissRef.current(), autoDismissMs);
    return () => clearTimeout(timer);
  }, [message, autoDismissMs]);

  return (
    <Alert
      role="status"
      className="border-success/25 bg-success-soft text-success-soft-foreground [&>svg]:text-success-soft-foreground py-3"
    >
      <CheckCircle2 aria-hidden="true" />
      <AlertDescription className="flex items-start justify-between gap-4 text-success-soft-foreground">
        <span className="font-medium">{message}</span>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss notification"
          className="hover:bg-success/10 focus-visible:ring-success/30 -m-1 rounded-md p-1 transition-colors focus-visible:ring-[3px] focus-visible:outline-hidden"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      </AlertDescription>
    </Alert>
  );
}
