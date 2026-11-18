"use client";

import Link from "next/link";
import { ExternalLink } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import type { Invoice } from "../invoices-api";
import {
  formatInvoiceCurrency,
  formatInvoiceDate,
} from "../invoice.utils";
import { DownloadInvoiceButton } from "./download-invoice-button";
import { InvoiceStatusBadge } from "./invoice-status-badge";

interface InvoicesTableProps {
  invoices: Invoice[];
}

export function InvoicesTable({ invoices }: InvoicesTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Invoice</TableHead>
          <TableHead>Order</TableHead>
          <TableHead className="hidden md:table-cell">Customer</TableHead>
          <TableHead className="hidden sm:table-cell">Issued</TableHead>
          <TableHead className="text-right">Total</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {invoices.map((invoice) => (
          <TableRow key={invoice.id}>
            <TableCell className="font-medium tracking-tight">
              {invoice.invoiceNumber}
            </TableCell>
            <TableCell>
              <Link
                href={`/orders/${invoice.orderId}`}
                className="text-primary inline-flex items-center gap-1.5 hover:underline"
              >
                {invoice.orderNumber}
                <ExternalLink className="size-3.5" aria-hidden="true" />
              </Link>
            </TableCell>
            <TableCell className="text-muted-foreground hidden max-w-48 truncate md:table-cell">
              {invoice.customerName ?? "—"}
            </TableCell>
            <TableCell className="text-muted-foreground hidden text-sm tabular-nums sm:table-cell">
              {formatInvoiceDate(invoice.issueDate)}
            </TableCell>
            <TableCell className="text-right text-sm font-medium tabular-nums">
              {formatInvoiceCurrency(invoice.totalAmount, invoice.currency)}
            </TableCell>
            <TableCell>
              <InvoiceStatusBadge status={invoice.status} />
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" size="sm" asChild>
                  <Link href={`/orders/${invoice.orderId}`}>View order</Link>
                </Button>
                <DownloadInvoiceButton
                  invoiceId={invoice.id}
                  invoiceNumber={invoice.invoiceNumber}
                  label="PDF"
                />
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
