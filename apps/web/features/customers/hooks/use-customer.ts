"use client";

import { useCallback, useEffect, useState } from "react";

import { ApiError } from "@/lib/api/client";

import { getCustomer, type Customer } from "../api/customers-api";

export type CustomerView =
  | { status: "loading" }
  | { status: "success"; data: Customer }
  | { status: "error"; message: string; notFound: boolean };

export function useCustomer(id: string) {
  const [view, setView] = useState<CustomerView>({ status: "loading" });
  const [fetchNonce, setFetchNonce] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    void (async () => {
      try {
        const customer = await getCustomer(id, {
          signal: controller.signal,
        });
        if (controller.signal.aborted) {
          return;
        }
        setView({ status: "success", data: customer });
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }
        setView({
          status: "error",
          message:
            error instanceof ApiError
              ? error.message
              : "Something went wrong while loading this customer.",
          notFound: error instanceof ApiError && error.status === 404,
        });
      }
    })();

    return () => controller.abort();
  }, [id, fetchNonce]);

  const refresh = useCallback(() => {
    setFetchNonce((nonce) => nonce + 1);
  }, []);

  return {
    view,
    customer: view.status === "success" ? view.data : null,
    refresh,
  };
}
