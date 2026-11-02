"use client";

import { useCallback, useEffect, useState } from "react";

import { ApiError } from "@/lib/api/client";

import { getOrder, type Order } from "../api/orders-api";

export type OrderView =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: Order }
  | { status: "error"; message: string; notFound: boolean };

/**
 * Loads a single order for the details and edit pages. Stays idle while
 * `id` is null (create mode) so no request is issued, and keeps the last
 * known data visible while a manual refresh is in flight.
 */
export function useOrder(id: string | null) {
  const [view, setView] = useState<OrderView>(() => ({
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
        const order = await getOrder(id, { signal: controller.signal });
        if (controller.signal.aborted) {
          return;
        }
        setView({ status: "success", data: order });
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }
        setView({
          status: "error",
          message:
            error instanceof ApiError
              ? error.message
              : "Something went wrong while loading this order.",
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
    order: view.status === "success" ? view.data : null,
    refresh,
  };
}
