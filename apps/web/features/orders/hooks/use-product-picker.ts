"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { ApiError } from "@/lib/api/client";

import { listProducts, type Product } from "@/features/products/api/products-api";

const SEARCH_DEBOUNCE_MS = 300;
const PICKER_RESULT_LIMIT = 20;

export type ProductPickerView =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: Product[] }
  | { status: "error"; message: string };

/**
 * Searches the active product catalog for the order product picker. Runs
 * only while the picker is open; inactive products are excluded because the
 * backend rejects them at order creation.
 */
export function useProductPicker(enabled: boolean) {
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(
    searchInput.trim(),
    SEARCH_DEBOUNCE_MS,
  );
  const [view, setView] = useState<ProductPickerView>({ status: "idle" });
  const [fetchNonce, setFetchNonce] = useState(0);
  const requestIdRef = useRef(0);

  // Reset the query when the picker closes (render-time adjustment so a
  // reopened picker starts fresh).
  const [wasEnabled, setWasEnabled] = useState(enabled);
  if (enabled !== wasEnabled) {
    setWasEnabled(enabled);
    if (!enabled) {
      setSearchInput("");
    }
  }

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const controller = new AbortController();
    const requestId = ++requestIdRef.current;

    void (async () => {
      setView({ status: "loading" });
      try {
        const result = await listProducts(
          {
            search: debouncedSearch || undefined,
            isActive: true,
            limit: PICKER_RESULT_LIMIT,
          },
          { signal: controller.signal },
        );

        if (requestIdRef.current !== requestId) {
          return;
        }
        setView({ status: "success", data: result.data });
      } catch (error) {
        if (controller.signal.aborted || requestIdRef.current !== requestId) {
          return;
        }
        setView({
          status: "error",
          message:
            error instanceof ApiError
              ? error.message
              : "Something went wrong while loading products.",
        });
      }
    })();

    return () => controller.abort();
  }, [enabled, debouncedSearch, fetchNonce]);

  const refresh = useCallback(() => {
    setFetchNonce((nonce) => nonce + 1);
  }, []);

  return {
    view,
    searchInput,
    setSearchInput,
    debouncedSearch,
    refresh,
  };
}
