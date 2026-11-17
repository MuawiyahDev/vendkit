"use client";

import { useCallback, useEffect, useState } from "react";

import { ApiError } from "@/lib/api/client";

import {
  getInventoryOverview,
  type InventoryOverview,
} from "../api/inventory-api";

export type InventoryOverviewView =
  | { status: "loading" }
  | { status: "success"; data: InventoryOverview }
  | { status: "error"; message: string };

export function useInventoryOverview() {
  const [view, setView] = useState<InventoryOverviewView>({
    status: "loading",
  });
  const [fetchNonce, setFetchNonce] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    void (async () => {
      try {
        const data = await getInventoryOverview({
          signal: controller.signal,
        });
        if (!controller.signal.aborted) {
          setView({ status: "success", data });
        }
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }
        setView({
          status: "error",
          message:
            error instanceof ApiError
              ? error.message
              : "Something went wrong while loading inventory totals.",
        });
      }
    })();

    return () => controller.abort();
  }, [fetchNonce]);

  const refresh = useCallback(() => {
    setFetchNonce((nonce) => nonce + 1);
  }, []);

  return { view, refresh };
}
