"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { ApiError } from "@/lib/api/client";

import {
  listStockMovements,
  type StockMovementListResponse,
  type StockMovementType,
} from "../api/inventory-api";

const SEARCH_DEBOUNCE_MS = 300;
const DEFAULT_PAGE_SIZE = 20;

export type StockMovementsView =
  | { status: "loading" }
  | { status: "success"; data: StockMovementListResponse }
  | { status: "error"; message: string };

export function useStockMovements() {
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(
    searchInput.trim(),
    SEARCH_DEBOUNCE_MS,
  );
  const [typeFilter, setTypeFilterState] = useState<StockMovementType | "all">(
    "all",
  );
  const [productFilter, setProductFilter] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [page, setPageState] = useState(1);
  const [pageSize, setPageSizeState] = useState(DEFAULT_PAGE_SIZE);
  const [view, setView] = useState<StockMovementsView>({ status: "loading" });
  const [isFetching, setIsFetching] = useState(true);
  const [fetchNonce, setFetchNonce] = useState(0);
  const requestIdRef = useRef(0);

  const [prevQuery, setPrevQuery] = useState({
    debouncedSearch,
    typeFilter,
    productId: productFilter?.id ?? null,
    pageSize,
  });

  if (
    prevQuery.debouncedSearch !== debouncedSearch ||
    prevQuery.typeFilter !== typeFilter ||
    prevQuery.productId !== (productFilter?.id ?? null) ||
    prevQuery.pageSize !== pageSize
  ) {
    setPrevQuery({
      debouncedSearch,
      typeFilter,
      productId: productFilter?.id ?? null,
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
        const result = await listStockMovements(
          {
            page,
            limit: pageSize,
            search: debouncedSearch || undefined,
            type: typeFilter === "all" ? undefined : typeFilter,
            productId: productFilter?.id,
            orderId: undefined,
            sortOrder: "desc",
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
              : "Something went wrong while loading stock movements.",
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
    typeFilter,
    productFilter?.id,
    fetchNonce,
  ]);

  const setTypeFilter = useCallback((next: StockMovementType | "all") => {
    setIsFetching(true);
    setTypeFilterState(next);
  }, []);

  const showProduct = useCallback((item: { id: string; name: string }) => {
    setIsFetching(true);
    setProductFilter({ id: item.id, name: item.name });
  }, []);

  const clearProductFilter = useCallback(() => {
    setIsFetching(true);
    setProductFilter(null);
  }, []);

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

  return {
    view,
    meta: view.status === "success" ? view.data.meta : null,
    isFetching,
    searchInput,
    setSearchInput,
    typeFilter,
    setTypeFilter,
    productFilter,
    showProduct,
    clearProductFilter,
    page,
    setPage,
    pageSize,
    setPageSize,
    refresh,
  };
}
