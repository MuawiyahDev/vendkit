"use client";

import { AlertCircle } from "lucide-react";

import { SuccessAlert } from "@/components/shared/success-alert";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface SettingsFormFeedbackProps {
  successMessage: string | null;
  error: string | null;
  onDismissSuccess: () => void;
}

/** Consistent success and failure messages above settings forms. */
export function SettingsFormFeedback({
  successMessage,
  error,
  onDismissSuccess,
}: SettingsFormFeedbackProps) {
  return (
    <>
      {successMessage ? (
        <SuccessAlert
          message={successMessage}
          onDismiss={onDismissSuccess}
        />
      ) : null}
      {error ? (
        <Alert variant="destructive">
          <AlertCircle aria-hidden="true" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
    </>
  );
}
