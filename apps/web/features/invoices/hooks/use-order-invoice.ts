"use client";

import { useCallback, useEffect, useState } from "react";

import { ApiError } from "@/lib/api/client";

import { getOrderInvoice, type InvoiceDetail } from "../invoices-api";

interface OrderInvoiceState {
  invoice: InvoiceDetail | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
}

/**
 * Loads the invoice attached to an order. A 404 is a normal state (the order
 * simply has no invoice yet), not an error for the user to fix.
 */
export function useOrderInvoice(orderId: string): OrderInvoiceState {
  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    getOrderInvoice(orderId, { signal: controller.signal })
      .then((result) => {
        if (!active) return;
        setInvoice(result);
        setError(null);
      })
      .catch((loadError: unknown) => {
        if (!active || controller.signal.aborted) return;

        if (loadError instanceof ApiError && loadError.status === 404) {
          setInvoice(null);
          return;
        }

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load this invoice.",
        );
      })
      .finally(() => {
        if (active) {
          setIsLoading(false);
        }
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [orderId, nonce]);

  const refresh = useCallback(() => {
    setIsLoading(true);
    setError(null);
    setNonce((value) => value + 1);
  }, []);

  return { invoice, isLoading, error, refresh };
}
