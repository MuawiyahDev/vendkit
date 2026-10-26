"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { ApiError } from "@/lib/api/client";

import { listBrands, type BrandListResponse } from "../api/brands-api";

const SEARCH_DEBOUNCE_MS = 300;

export const DEFAULT_PAGE_SIZE = 20;

export type BrandStatusFilter = "all" | "active" | "inactive";

export type BrandsView =
  | { status: "loading" }
  | { status: "success"; data: BrandListResponse }
  | { status: "error"; message: string };

function toIsActiveFilter(filter: BrandStatusFilter): boolean | undefined {
  if (filter === "active") {
    return true;
  }
  if (filter === "inactive") {
    return false;
  }
  return undefined;
}

/**
 * Owns the brands list query state (debounced search, status filter,
 * pagination) and keeps responses ordered so stale requests never overwrite
 * newer results.
 */
export function useBrands() {
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(
    searchInput.trim(),
    SEARCH_DEBOUNCE_MS,
  );
  const [statusFilter, setStatusFilterState] =
    useState<BrandStatusFilter>("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [view, setView] = useState<BrandsView>({ status: "loading" });
  const [isFetching, setIsFetching] = useState(true);
  const [fetchNonce, setFetchNonce] = useState(0);
  const requestIdRef = useRef(0);

  // Reset pagination as soon as the query changes (render-time adjustment,
  // avoiding a cascading effect-driven setState).
  const [prevQuery, setPrevQuery] = useState({
    debouncedSearch,
    statusFilter,
    pageSize,
  });
  if (
    prevQuery.debouncedSearch !== debouncedSearch ||
    prevQuery.statusFilter !== statusFilter ||
    prevQuery.pageSize !== pageSize
  ) {
    setPrevQuery({ debouncedSearch, statusFilter, pageSize });
    setPage(1);
    setIsFetching(true);
  }

  useEffect(() => {
    const controller = new AbortController();
    const requestId = ++requestIdRef.current;

    void (async () => {
      try {
        const result = await listBrands(
          {
            page,
            limit: pageSize,
            search: debouncedSearch || undefined,
            isActive: toIsActiveFilter(statusFilter),
          },
          { signal: controller.signal },
        );

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
              : "Something went wrong while loading brands.",
        });
      } finally {
        if (!controller.signal.aborted && requestIdRef.current === requestId) {
          setIsFetching(false);
        }
      }
    })();

    return () => controller.abort();
  }, [page, pageSize, debouncedSearch, statusFilter, fetchNonce]);

  const setStatusFilter = useCallback((next: BrandStatusFilter) => {
    setIsFetching(true);
    setStatusFilterState(next);
  }, []);

  const changePage = useCallback((nextPage: number) => {
    setIsFetching(true);
    setPage(nextPage);
  }, []);

  const changePageSize = useCallback((nextPageSize: number) => {
    setIsFetching(true);
    setPageSize(nextPageSize);
  }, []);

  const refresh = useCallback(() => {
    setIsFetching(true);
    setFetchNonce((nonce) => nonce + 1);
  }, []);

  return {
    view,
    isFetching,
    searchInput,
    debouncedSearch,
    setSearchInput,
    statusFilter,
    setStatusFilter,
    page,
    setPage: changePage,
    pageSize,
    setPageSize: changePageSize,
    refresh,
  };
}
