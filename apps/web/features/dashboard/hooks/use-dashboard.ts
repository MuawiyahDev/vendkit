"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { ApiError } from "@/lib/api/client";

import { getDashboard } from "../api/dashboard-api";
import { DEFAULT_DASHBOARD_PRESET } from "../dashboard.constants";
import type {
  DashboardRangeSelection,
  DashboardResponse,
} from "../dashboard.types";

export function useDashboard() {
  const [selection, setSelection] = useState<DashboardRangeSelection>({
    preset: DEFAULT_DASHBOARD_PRESET,
  });
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(true);
  const [fetchNonce, setFetchNonce] = useState(0);
  const requestIdRef = useRef(0);

  useEffect(() => {
    const controller = new AbortController();
    const requestId = ++requestIdRef.current;

    void (async () => {
      try {
        const result = await getDashboard(selection, {
          signal: controller.signal,
        });

        if (controller.signal.aborted || requestIdRef.current !== requestId) {
          return;
        }

        setData(result);
        setError(null);
      } catch (requestError) {
        if (controller.signal.aborted || requestIdRef.current !== requestId) {
          return;
        }

        setError(
          requestError instanceof ApiError
            ? requestError.message
            : "Something went wrong while loading the dashboard.",
        );
      } finally {
        if (!controller.signal.aborted && requestIdRef.current === requestId) {
          setIsLoading(false);
          setIsFetching(false);
        }
      }
    })();

    return () => controller.abort();
  }, [selection, fetchNonce]);

  /** Clears the current dashboard so a range switch cannot show stale values. */
  const selectRange = useCallback((next: DashboardRangeSelection) => {
    setData(null);
    setError(null);
    setIsLoading(true);
    setIsFetching(true);
    setSelection(next);
  }, []);

  const refresh = useCallback(() => {
    setIsFetching(true);
    setFetchNonce((nonce) => nonce + 1);
  }, []);

  const retry = useCallback(() => {
    if (data === null) {
      setIsLoading(true);
    }
    setIsFetching(true);
    setError(null);
    setFetchNonce((nonce) => nonce + 1);
  }, [data]);

  return {
    selection,
    data,
    error,
    isLoading,
    isFetching,
    selectRange,
    refresh,
    retry,
  };
}
