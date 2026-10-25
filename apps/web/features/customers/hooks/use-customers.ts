"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { ApiError } from "@/lib/api/client";

import {
  listCustomers,
  type CustomerListResponse,
  type CustomerSortField,
  type SortOrder,
} from "../api/customers-api";
import { useDebouncedValue } from "./use-debounced-value";

const SEARCH_DEBOUNCE_MS = 300;

export const DEFAULT_PAGE_SIZE = 20;

export type CustomersView =
  | { status: "loading" }
  | { status: "success"; data: CustomerListResponse }
  | { status: "error"; message: string };

export const DEFAULT_SORT: {
  sortBy: CustomerSortField;
  sortOrder: SortOrder;
} = { sortBy: "createdAt", sortOrder: "desc" };

/**
 * Owns the customers list query state (debounced search, pagination, sorting)
 * and keeps responses ordered so stale requests never overwrite newer results.
 */
export function useCustomers() {
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(
    searchInput.trim(),
    SEARCH_DEBOUNCE_MS,
  );
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [sortBy, setSortByState] = useState<CustomerSortField>(
    DEFAULT_SORT.sortBy,
  );
  const [sortOrder, setSortOrderState] = useState<SortOrder>(
    DEFAULT_SORT.sortOrder,
  );
  const [view, setView] = useState<CustomersView>({ status: "loading" });
  const [isFetching, setIsFetching] = useState(true);
  const [fetchNonce, setFetchNonce] = useState(0);
  const requestIdRef = useRef(0);

  // Reset pagination as soon as the query changes (render-time adjustment,
  // avoiding a cascading effect-driven setState).
  const [prevQuery, setPrevQuery] = useState({
    debouncedSearch,
    sortBy,
    sortOrder,
    pageSize,
  });
  if (
    prevQuery.debouncedSearch !== debouncedSearch ||
    prevQuery.sortBy !== sortBy ||
    prevQuery.sortOrder !== sortOrder ||
    prevQuery.pageSize !== pageSize
  ) {
    setPrevQuery({ debouncedSearch, sortBy, sortOrder, pageSize });
    setPage(1);
    setIsFetching(true);
  }

  useEffect(() => {
    const controller = new AbortController();
    const requestId = ++requestIdRef.current;

    void (async () => {
      try {
        const result = await listCustomers(
          {
            page,
            limit: pageSize,
            search: debouncedSearch || undefined,
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
              : "Something went wrong while loading customers.",
        });
      } finally {
        if (!controller.signal.aborted && requestIdRef.current === requestId) {
          setIsFetching(false);
        }
      }
    })();

    return () => controller.abort();
  }, [page, pageSize, debouncedSearch, sortBy, sortOrder, fetchNonce]);

  const setSort = useCallback(
    (next: { sortBy: CustomerSortField; sortOrder: SortOrder }) => {
      setIsFetching(true);
      setSortByState(next.sortBy);
      setSortOrderState(next.sortOrder);
    },
    [],
  );

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
    page,
    setPage: changePage,
    pageSize,
    setPageSize: changePageSize,
    sortBy,
    sortOrder,
    setSort,
    refresh,
  };
}
