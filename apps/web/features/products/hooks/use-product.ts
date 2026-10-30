"use client";

import { useCallback, useEffect, useState } from "react";

import { ApiError } from "@/lib/api/client";

import { getProduct, type Product } from "../api/products-api";

export type ProductView =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: Product }
  | { status: "error"; message: string; notFound: boolean };

/**
 * Loads a single product for the full-page editor. Stays idle while `id`
 * is null (create mode) so no request is issued, and keeps the last known
 * data visible while a manual refresh is in flight.
 */
export function useProduct(id: string | null) {
  const [view, setView] = useState<ProductView>(() => ({
    status: id ? "loading" : "idle",
  }));
  const [fetchNonce, setFetchNonce] = useState(0);

  useEffect(() => {
    if (!id) {
      return;
    }
    const controller = new AbortController();

    void (async () => {
      try {
        const product = await getProduct(id, { signal: controller.signal });
        if (controller.signal.aborted) {
          return;
        }
        setView({ status: "success", data: product });
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }
        setView({
          status: "error",
          message:
            error instanceof ApiError
              ? error.message
              : "Something went wrong while loading this product.",
          notFound: error instanceof ApiError && error.status === 404,
        });
      }
    })();

    return () => controller.abort();
  }, [id, fetchNonce]);

  const refresh = useCallback(() => {
    setView((current) =>
      current.status === "error" ? { status: "loading" } : current,
    );
    setFetchNonce((nonce) => nonce + 1);
  }, []);

  return {
    view,
    product: view.status === "success" ? view.data : null,
    refresh,
  };
}
