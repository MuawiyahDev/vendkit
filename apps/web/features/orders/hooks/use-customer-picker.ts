"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  listCustomers,
  type Customer,
} from "@/features/customers/api/customers-api";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { ApiError } from "@/lib/api/client";

const SEARCH_DEBOUNCE_MS = 300;
const PICKER_RESULT_LIMIT = 20;

export type CustomerPickerView =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: Customer[] }
  | { status: "error"; message: string };

/**
 * Searches the customer directory for the order customer picker. Runs only
 * while the picker is open and shows the most recent customers when the
 * search box is empty.
 */
export function useCustomerPicker(enabled: boolean) {
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(
    searchInput.trim(),
    SEARCH_DEBOUNCE_MS,
  );
  const [view, setView] = useState<CustomerPickerView>({ status: "idle" });
  const [fetchNonce, setFetchNonce] = useState(0);
  const requestIdRef = useRef(0);

  // Reset the query when the picker closes (render-time adjustment so a
  // reopened picker starts fresh with the recent-customer list).
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
        const result = await listCustomers(
          {
            search: debouncedSearch || undefined,
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
              : "Something went wrong while loading customers.",
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
