"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { ApiError } from "@/lib/api/client";

import {
  getCustomerOrderHistory,
  type CustomerOrderHistoryResponse,
} from "../api/customers-api";

export type CustomerOrdersView =
  | { status: "loading" }
  | { status: "success"; data: CustomerOrderHistoryResponse }
  | { status: "error"; message: string };

export function useCustomerOrders(id: string) {
  const [page, setPage] = useState(1);
  const [view, setView] = useState<CustomerOrdersView>({ status: "loading" });
  const [fetchNonce, setFetchNonce] = useState(0);
  const requestIdRef = useRef(0);

  useEffect(() => {
    const controller = new AbortController();
    const requestId = ++requestIdRef.current;

    void (async () => {
      try {
        const result = await getCustomerOrderHistory(id, page, {
          signal: controller.signal,
        });
        if (requestIdRef.current !== requestId) {
          return;
        }
        setView({ status: "success", data: result });
      } catch (error) {
        if (controller.signal.aborted || requestIdRef.current !== requestId) {
          return;
        }
        setView({
          status: "error",
          message:
            error instanceof ApiError
              ? error.message
              : "Something went wrong while loading orders.",
        });
      }
    })();

    return () => controller.abort();
  }, [id, page, fetchNonce]);

  const refresh = useCallback(() => {
    setFetchNonce((nonce) => nonce + 1);
  }, []);

  return {
    view,
    page,
    setPage,
    refresh,
  };
}
