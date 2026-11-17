"use client";

import { useEffect, useRef, useState } from "react";

import { ApiError } from "@/lib/api/client";
import {
  listProducts,
  type Product,
} from "@/features/products/api/products-api";

export type OrderProductsView =
  | { status: "loading" }
  | { status: "success"; products: Record<string, Product> }
  | { status: "error"; message: string };

/**
 * Loads the current catalog records for the products already on an order.
 * Quantities are edited against live stock data, while prices remain the
 * values captured when each line was added.
 */
export function useOrderProducts(productIds: string[]) {
  const idsKey = [...new Set(productIds)].sort().join(",");
  const [view, setView] = useState<OrderProductsView>(() =>
    idsKey.length === 0
      ? { status: "success", products: {} }
      : { status: "loading" },
  );
  const [fetchNonce, setFetchNonce] = useState(0);
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (idsKey.length === 0) {
      return;
    }

    const controller = new AbortController();
    const requestId = ++requestIdRef.current;

    void (async () => {
      try {
        const result = await listProducts(
          { ids: idsKey.split(","), limit: 100 },
          { signal: controller.signal },
        );

        if (requestIdRef.current !== requestId) {
          return;
        }

        setView({
          status: "success",
          products: Object.fromEntries(
            result.data.map((product) => [product.id, product]),
          ),
        });
      } catch (error) {
        if (controller.signal.aborted || requestIdRef.current !== requestId) {
          return;
        }
        setView({
          status: "error",
          message:
            error instanceof ApiError
              ? error.message
              : "Something went wrong while loading order products.",
        });
      }
    })();

    return () => controller.abort();
  }, [idsKey, fetchNonce]);

  return {
    view,
    refresh: () => setFetchNonce((nonce) => nonce + 1),
  };
}
