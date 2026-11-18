"use client";

import { Download, Loader2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { apiErrorFromPayload } from "@/lib/api/client";
import { cn } from "@/lib/utils";

import { invoiceFileUrl } from "../invoices-api";
import { buildInvoiceFileName } from "../invoice.utils";

interface DownloadInvoiceButtonProps {
  invoiceId: string;
  invoiceNumber: string;
  label?: string;
  className?: string;
  variant?: React.ComponentProps<typeof Button>["variant"];
}

/**
 * Fetches the stored invoice PDF and saves it through a temporary object URL.
 * Going through `fetch` (instead of a plain link) lets the button show a
 * loading state and surface a readable error when generation fails.
 */
export function DownloadInvoiceButton({
  invoiceId,
  invoiceNumber,
  label = "Download",
  className,
  variant = "outline",
}: DownloadInvoiceButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDownload() {
    setError(null);
    setIsDownloading(true);

    try {
      const response = await fetch(invoiceFileUrl(invoiceId), {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) {
        const payload: unknown = await response.json().catch(() => null);
        throw apiErrorFromPayload(response.status, payload);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = buildInvoiceFileName(invoiceNumber);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (downloadError) {
      setError(
        downloadError instanceof Error
          ? downloadError.message
          : "Unable to generate the invoice. Please try again.",
      );
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <Button
        type="button"
        variant={variant}
        onClick={() => {
          void handleDownload();
        }}
        disabled={isDownloading}
        title="Download invoice PDF"
        aria-label={`Download invoice ${invoiceNumber} as PDF`}
      >
        {isDownloading ? (
          <Loader2 className="animate-spin" aria-hidden="true" />
        ) : (
          <Download aria-hidden="true" />
        )}
        {isDownloading ? "Generating..." : label}
      </Button>
      {error ? (
        <p
          role="alert"
          className="text-destructive max-w-56 text-xs leading-snug"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
