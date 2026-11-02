"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { ApiError } from "@/lib/api/client";

import {
  listOrders,
  type OrderListParams,
  type OrderListResponse,
  type OrderSortField,
  type OrderStatus,
  type PaymentStatus,
  type SortOrder,
} from "../api/orders-api";

const SEARCH_DEBOUNCE_MS = 300;

export const DEFAULT_PAGE_SIZE = 20;

export const DEFAULT_SORT: {
  sortBy: OrderSortField;
  sortOrder: SortOrder;
} = { sortBy: "createdAt", sortOrder: "desc" };

export type OrderStatusFilter = "all" | OrderStatus;

export type PaymentStatusFilter = "all" | PaymentStatus;

export type OrdersView =
  | { status: "loading" }
  | { status: "success"; data: OrderListResponse }
  | { status: "error"; message: string };

function toStatusFilter(
  filter: OrderStatusFilter,
): OrderStatus | undefined {
  return filter === "all" ? undefined : filter;
}

function toPaymentStatusFilter(
  filter: PaymentStatusFilter,
): PaymentStatus | undefined {
  return filter === "all" ? undefined : filter;
}

/**
 * Owns the orders list query state (debounced search, status/payment/date
 * filters, sorting, pagination) and keeps responses ordered so stale
 * requests never overwrite newer results.
 */
export function useOrders() {
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(
    searchInput.trim(),
    SEARCH_DEBOUNCE_MS,
  );
  const [statusFilter, setStatusFilterState] =
    useState<OrderStatusFilter>("all");
  const [paymentStatusFilter, setPaymentStatusFilterState] =
    useState<PaymentStatusFilter>("all");
  const [dateFrom, setDateFromState] = useState("");
  const [dateTo, setDateToState] = useState("");
  const [sortBy, setSortByState] = useState<OrderSortField>(
    DEFAULT_SORT.sortBy,
  );
  const [sortOrder, setSortOrderState] = useState<SortOrder>(
    DEFAULT_SORT.sortOrder,
  );
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [view, setView] = useState<OrdersView>({ status: "loading" });
  const [isFetching, setIsFetching] = useState(true);
  const [fetchNonce, setFetchNonce] = useState(0);
  const requestIdRef = useRef(0);

  // Reset pagination as soon as the query changes (render-time adjustment,
  // avoiding a cascading effect-driven setState).
  const [prevQuery, setPrevQuery] = useState({
    debouncedSearch,
    statusFilter,
    paymentStatusFilter,
    dateFrom,
    dateTo,
    sortBy,
    sortOrder,
    pageSize,
  });
  if (
    prevQuery.debouncedSearch !== debouncedSearch ||
    prevQuery.statusFilter !== statusFilter ||
    prevQuery.paymentStatusFilter !== paymentStatusFilter ||
    prevQuery.dateFrom !== dateFrom ||
    prevQuery.dateTo !== dateTo ||
    prevQuery.sortBy !== sortBy ||
    prevQuery.sortOrder !== sortOrder ||
    prevQuery.pageSize !== pageSize
  ) {
    setPrevQuery({
      debouncedSearch,
      statusFilter,
      paymentStatusFilter,
      dateFrom,
      dateTo,
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

    const params: OrderListParams = {
      page,
      limit: pageSize,
      search: debouncedSearch || undefined,
      status: toStatusFilter(statusFilter),
      paymentStatus: toPaymentStatusFilter(paymentStatusFilter),
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      sortBy,
      sortOrder,
    };

    void (async () => {
      try {
        const result = await listOrders(params, { signal: controller.signal });

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
              : "Something went wrong while loading orders.",
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
    paymentStatusFilter,
    dateFrom,
    dateTo,
    sortBy,
    sortOrder,
    fetchNonce,
  ]);

  const setStatusFilter = useCallback((next: OrderStatusFilter) => {
    setIsFetching(true);
    setStatusFilterState(next);
  }, []);

  const setPaymentStatusFilter = useCallback(
    (next: PaymentStatusFilter) => {
      setIsFetching(true);
      setPaymentStatusFilterState(next);
    },
    [],
  );

  const setDateFrom = useCallback((next: string) => {
    setIsFetching(true);
    setDateFromState(next);
  }, []);

  const setDateTo = useCallback((next: string) => {
    setIsFetching(true);
    setDateToState(next);
  }, []);

  const setSort = useCallback(
    (next: { sortBy: OrderSortField; sortOrder: SortOrder }) => {
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
    setPaymentStatusFilterState("all");
    setDateFromState("");
    setDateToState("");
  }, []);

  return {
    view,
    isFetching,
    searchInput,
    debouncedSearch,
    setSearchInput,
    statusFilter,
    setStatusFilter,
    paymentStatusFilter,
    setPaymentStatusFilter,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
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
