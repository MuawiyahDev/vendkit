"use client";

import { AlertCircle, FileText, LoaderCircle, Plus } from "lucide-react";
import { useState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "@/lib/api/client";
import type { Order } from "@/features/orders/api/orders-api";

import {
  issueInvoice,
  type InvoiceDetail,
} from "../invoices-api";
import {
  formatInvoiceCurrency,
  formatInvoiceDate,
} from "../invoice.utils";
import { useOrderInvoice } from "../hooks/use-order-invoice";
import { CancelInvoiceDialog } from "./cancel-invoice-dialog";
import { CreateInvoiceDialog } from "./create-invoice-dialog";
import { DownloadInvoiceButton } from "./download-invoice-button";
import { InvoiceStatusBadge } from "./invoice-status-badge";

interface OrderInvoiceCardProps {
  order: Pick<Order, "id" | "orderNumber" | "status">;
}

/**
 * Invoice panel for the order detail page. It loads the invoice separately
 * from the order so the order page stays useful even when the invoice module
 * is unavailable, and so creating an invoice never reloads the whole order.
 */
export function OrderInvoiceCard({ order }: OrderInvoiceCardProps) {
  const { invoice, isLoading, error, refresh } = useOrderInvoice(order.id);
  const [localInvoice, setLocalInvoice] = useState<InvoiceDetail | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [isIssuing, setIsIssuing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const activeInvoice = localInvoice ?? invoice;

  function applyInvoice(next: InvoiceDetail) {
    setLocalInvoice(next);
    refresh();
  }

  async function handleIssue() {
    if (!activeInvoice) return;
    setActionError(null);
    setIsIssuing(true);

    try {
      const issued = await issueInvoice(activeInvoice.id);
      applyInvoice(issued);
    } catch (issueError) {
      setActionError(
        issueError instanceof ApiError
          ? issueError.message
          : "Unable to issue the invoice. Please try again.",
      );
    } finally {
      setIsIssuing(false);
    }
  }

  return (
    <Card className="gap-0 overflow-hidden py-0">
      <CardHeader className="border-border-subtle border-b py-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="size-4" aria-hidden="true" />
              Invoice
            </CardTitle>
            <CardDescription className="mt-1">
              A numbered document for this order, captured when issued.
            </CardDescription>
          </div>
          {activeInvoice ? (
            <InvoiceStatusBadge status={activeInvoice.status} />
          ) : null}
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-4 py-5">
        {isLoading && !activeInvoice ? (
          <div className="flex flex-col gap-2" role="status">
            <span className="sr-only">Loading invoice…</span>
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : null}

        {error ? (
          <Alert variant="destructive">
            <AlertCircle aria-hidden="true" />
            <AlertDescription className="flex flex-col gap-2">
              <span>{error}</span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={refresh}
                className="self-start"
              >
                Try again
              </Button>
            </AlertDescription>
          </Alert>
        ) : null}

        {actionError ? (
          <Alert variant="destructive">
            <AlertCircle aria-hidden="true" />
            <AlertDescription>{actionError}</AlertDescription>
          </Alert>
        ) : null}

        {!isLoading && !error && !activeInvoice ? (
          <div className="flex flex-col gap-3">
            <p className="text-muted-foreground text-sm leading-relaxed">
              {order.status === "CANCELLED"
                ? "Invoices cannot be created for a cancelled order."
                : "Create an invoice to reserve a number and produce a PDF for the buyer."}
            </p>
            <Button
              type="button"
              size="sm"
              className="self-start"
              disabled={order.status === "CANCELLED"}
              onClick={() => setIsCreateOpen(true)}
            >
              <Plus aria-hidden="true" />
              Create invoice
            </Button>
          </div>
        ) : null}

        {activeInvoice ? (
          <div className="flex flex-col gap-4">
            <dl className="flex flex-col gap-2 text-sm">
              <FactRow
                label="Invoice number"
                value={activeInvoice.invoiceNumber}
                emphasize
              />
              <FactRow
                label="Issued"
                value={formatInvoiceDate(activeInvoice.issueDate)}
              />
              {activeInvoice.dueDate ? (
                <FactRow
                  label="Due"
                  value={formatInvoiceDate(activeInvoice.dueDate)}
                />
              ) : null}
              <FactRow
                label="Total"
                value={formatInvoiceCurrency(
                  activeInvoice.totalAmount,
                  activeInvoice.currency,
                )}
              />
            </dl>

            {activeInvoice.cancelledAt ? (
              <div className="bg-surface-muted flex flex-col gap-1 rounded-lg px-3 py-2">
                <p className="text-sm font-medium">
                  Cancelled {formatInvoiceDate(activeInvoice.cancelledAt)}
                </p>
                {activeInvoice.cancellationReason ? (
                  <p className="text-muted-foreground text-xs leading-relaxed">
                    {activeInvoice.cancellationReason}
                  </p>
                ) : null}
              </div>
            ) : null}

            <div className="flex flex-wrap gap-2">
              <DownloadInvoiceButton
                invoiceId={activeInvoice.id}
                invoiceNumber={activeInvoice.invoiceNumber}
              />
              {activeInvoice.status === "DRAFT" ? (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    void handleIssue();
                  }}
                  disabled={isIssuing}
                >
                  {isIssuing ? (
                    <LoaderCircle
                      className="animate-spin"
                      aria-hidden="true"
                    />
                  ) : null}
                  {isIssuing ? "Issuing…" : "Issue invoice"}
                </Button>
              ) : null}
              {activeInvoice.status !== "CANCELLED" ? (
                <Button
                  type="button"
                  size="sm"
                  variant="destructive-outline"
                  onClick={() => setIsCancelOpen(true)}
                >
                  Cancel
                </Button>
              ) : null}
            </div>
          </div>
        ) : null}
      </CardContent>

      <CreateInvoiceDialog
        orderId={order.id}
        orderNumber={order.orderNumber}
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onCreated={applyInvoice}
      />

      {activeInvoice ? (
        <CancelInvoiceDialog
          invoice={activeInvoice}
          open={isCancelOpen}
          onOpenChange={setIsCancelOpen}
          onCancelled={applyInvoice}
        />
      ) : null}
    </Card>
  );
}

interface FactRowProps {
  label: string;
  value: string;
  emphasize?: boolean;
}

function FactRow({ label, value, emphasize }: FactRowProps) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd
        className={
          emphasize
            ? "text-foreground font-semibold tabular-nums"
            : "text-foreground tabular-nums"
        }
      >
        {value}
      </dd>
    </div>
  );
}
