"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { ApiError } from "@/lib/api/client";

import {
  listInventory,
  type InventoryItem,
  type InventoryListResponse,
  type InventorySortField,
  type InventoryStatusFilter,
  type SortOrder,
} from "../api/inventory-api";

const SEARCH_DEBOUNCE_MS = 300;
const DEFAULT_PAGE_SIZE = 20;

export type InventoryView =
  | { status: "loading" }
  | { status: "success"; data: InventoryListResponse }
  | { status: "error"; message: string };

const DEFAULT_SORT: { sortBy: InventorySortField; sortOrder: SortOrder } = {
  sortBy: "stockQuantity",
  sortOrder: "asc",
};

/**
 * Owns inventory list query state. Requests are sequenced so a slow response
 * can never overwrite a newer filter or search result.
 */
export function useInventory() {
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(
    searchInput.trim(),
    SEARCH_DEBOUNCE_MS,
  );
  const [statusFilter, setStatusFilterState] =
    useState<InventoryStatusFilter>("all");
  const [sortBy, setSortBy] = useState<InventorySortField>(DEFAULT_SORT.sortBy);
  const [sortOrder, setSortOrder] = useState<SortOrder>(DEFAULT_SORT.sortOrder);
  const [page, setPageState] = useState(1);
  const [pageSize, setPageSizeState] = useState(DEFAULT_PAGE_SIZE);
  const [view, setView] = useState<InventoryView>({ status: "loading" });
  const [isFetching, setIsFetching] = useState(true);
  const [fetchNonce, setFetchNonce] = useState(0);
  const requestIdRef = useRef(0);

  const [prevQuery, setPrevQuery] = useState({
    debouncedSearch,
    statusFilter,
    sortBy,
    sortOrder,
    pageSize,
  });

  if (
    prevQuery.debouncedSearch !== debouncedSearch ||
    prevQuery.statusFilter !== statusFilter ||
    prevQuery.sortBy !== sortBy ||
    prevQuery.sortOrder !== sortOrder ||
    prevQuery.pageSize !== pageSize
  ) {
    setPrevQuery({
      debouncedSearch,
      statusFilter,
      sortBy,
      sortOrder,
      pageSize,
    });
    setPageState(1);
    setIsFetching(true);
  }

  useEffect(() => {
    const controller = new AbortController();
    const requestId = ++requestIdRef.current;

    void (async () => {
      try {
        const result = await listInventory(
          {
            page,
            limit: pageSize,
            search: debouncedSearch || undefined,
            status: statusFilter,
            sortBy,
            sortOrder,
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
              : "Something went wrong while loading inventory.",
        });
      } finally {
        if (!controller.signal.aborted && requestIdRef.current === requestId) {
          setIsFetching(false);
        }
      }
    })();

    return () => controller.abort();
  }, [page, pageSize, debouncedSearch, statusFilter, sortBy, sortOrder, fetchNonce]);

  const setStatusFilter = useCallback((next: InventoryStatusFilter) => {
    setIsFetching(true);
    setStatusFilterState(next);
  }, []);

  const setSort = useCallback(
    (next: { sortBy: InventorySortField; sortOrder: SortOrder }) => {
      setIsFetching(true);
      setSortBy(next.sortBy);
      setSortOrder(next.sortOrder);
    },
    [],
  );

  const setPage = useCallback((next: number) => {
    setIsFetching(true);
    setPageState(next);
  }, []);

  const setPageSize = useCallback((next: number) => {
    setIsFetching(true);
    setPageSizeState(next);
  }, []);

  const refresh = useCallback(() => {
    setIsFetching(true);
    setFetchNonce((nonce) => nonce + 1);
  }, []);

  const clearFilters = useCallback(() => {
    setSearchInput("");
    setStatusFilterState("all");
    setSortBy(DEFAULT_SORT.sortBy);
    setSortOrder(DEFAULT_SORT.sortOrder);
  }, []);

  const items: InventoryItem[] =
    view.status === "success" ? view.data.data : [];

  return {
    view,
    items,
    meta: view.status === "success" ? view.data.meta : null,
    isFetching,
    searchInput,
    debouncedSearch,
    setSearchInput,
    statusFilter,
    setStatusFilter,
    sortBy,
    sortOrder,
    setSort,
    page,
    setPage,
    pageSize,
    setPageSize,
    refresh,
    clearFilters,
  };
}
