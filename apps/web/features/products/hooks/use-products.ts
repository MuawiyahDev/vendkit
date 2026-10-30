"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { ApiError } from "@/lib/api/client";

import {
  listProducts,
  type ProductListResponse,
  type ProductSortField,
  type SortOrder,
} from "../api/products-api";

const SEARCH_DEBOUNCE_MS = 300;

export const DEFAULT_PAGE_SIZE = 20;

export const DEFAULT_SORT: {
  sortBy: ProductSortField;
  sortOrder: SortOrder;
} = { sortBy: "createdAt", sortOrder: "desc" };

export type ProductStatusFilter = "all" | "active" | "inactive";

export type ProductStockFilter = "all" | "low";

export type ProductsView =
  | { status: "loading" }
  | { status: "success"; data: ProductListResponse }
  | { status: "error"; message: string };

function toIsActiveFilter(
  filter: ProductStatusFilter,
): boolean | undefined {
  if (filter === "active") {
    return true;
  }
  if (filter === "inactive") {
    return false;
  }
  return undefined;
}

function toLowStockFilter(
  filter: ProductStockFilter,
): boolean | undefined {
  return filter === "low" ? true : undefined;
}

/**
 * Owns the products list query state (debounced search, category/brand/
 * status/stock filters, sorting, pagination) and keeps responses ordered so
 * stale requests never overwrite newer results.
 */
export function useProducts() {
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(
    searchInput.trim(),
    SEARCH_DEBOUNCE_MS,
  );
  const [statusFilter, setStatusFilterState] =
    useState<ProductStatusFilter>("all");
  const [stockFilter, setStockFilterState] =
    useState<ProductStockFilter>("all");
  const [categoryId, setCategoryIdState] = useState("");
  const [brandId, setBrandIdState] = useState("");
  const [sortBy, setSortByState] = useState<ProductSortField>(
    DEFAULT_SORT.sortBy,
  );
  const [sortOrder, setSortOrderState] = useState<SortOrder>(
    DEFAULT_SORT.sortOrder,
  );
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [view, setView] = useState<ProductsView>({ status: "loading" });
  const [isFetching, setIsFetching] = useState(true);
  const [fetchNonce, setFetchNonce] = useState(0);
  const requestIdRef = useRef(0);

  // Reset pagination as soon as the query changes (render-time adjustment,
  // avoiding a cascading effect-driven setState).
  const [prevQuery, setPrevQuery] = useState({
    debouncedSearch,
    statusFilter,
    stockFilter,
    categoryId,
    brandId,
    sortBy,
    sortOrder,
    pageSize,
  });
  if (
    prevQuery.debouncedSearch !== debouncedSearch ||
    prevQuery.statusFilter !== statusFilter ||
    prevQuery.stockFilter !== stockFilter ||
    prevQuery.categoryId !== categoryId ||
    prevQuery.brandId !== brandId ||
    prevQuery.sortBy !== sortBy ||
    prevQuery.sortOrder !== sortOrder ||
    prevQuery.pageSize !== pageSize
  ) {
    setPrevQuery({
      debouncedSearch,
      statusFilter,
      stockFilter,
      categoryId,
      brandId,
      sortBy,
      sortOrder,
      pageSize,
    });
    setPage(1);
    setIsFetching(true);
  }

  useEffect(() => {
    const controller = new AbortController();
    const requestId = ++requestIdRef.current;

    void (async () => {
      try {
        const result = await listProducts(
          {
            page,
            limit: pageSize,
            search: debouncedSearch || undefined,
            categoryId: categoryId || undefined,
            brandId: brandId || undefined,
            isActive: toIsActiveFilter(statusFilter),
            lowStock: toLowStockFilter(stockFilter),
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
              : "Something went wrong while loading products.",
        });
      } finally {
        if (!controller.signal.aborted && requestIdRef.current === requestId) {
          setIsFetching(false);
        }
      }
    })();

    return () => controller.abort();
  }, [
    page,
    pageSize,
    debouncedSearch,
    statusFilter,
    stockFilter,
    categoryId,
    brandId,
    sortBy,
    sortOrder,
    fetchNonce,
  ]);

  const setStatusFilter = useCallback(
    (next: ProductStatusFilter) => {
      setIsFetching(true);
      setStatusFilterState(next);
    },
    [],
  );

  const setStockFilter = useCallback((next: ProductStockFilter) => {
    setIsFetching(true);
    setStockFilterState(next);
  }, []);

  const setCategoryId = useCallback((next: string) => {
    setIsFetching(true);
    setCategoryIdState(next);
  }, []);

  const setBrandId = useCallback((next: string) => {
    setIsFetching(true);
    setBrandIdState(next);
  }, []);

  const setSort = useCallback(
    (next: { sortBy: ProductSortField; sortOrder: SortOrder }) => {
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

  const clearFilters = useCallback(() => {
    setSearchInput("");
    setStatusFilterState("all");
    setStockFilterState("all");
    setCategoryIdState("");
    setBrandIdState("");
  }, []);

  return {
    view,
    isFetching,
    searchInput,
    debouncedSearch,
    setSearchInput,
    statusFilter,
    setStatusFilter,
    stockFilter,
    setStockFilter,
    categoryId,
    setCategoryId,
    brandId,
    setBrandId,
    sortBy,
    sortOrder,
    setSort,
    page,
    setPage: changePage,
    pageSize,
    setPageSize: changePageSize,
    refresh,
    clearFilters,
  };
}
