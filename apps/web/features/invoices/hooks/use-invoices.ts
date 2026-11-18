"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useDebouncedValue } from "@/hooks/use-debounced-value";
import type { PaginationMeta } from "@/lib/api/types";

import {
  listInvoices,
  type Invoice,
  type InvoiceStatus,
} from "../invoices-api";

export type InvoiceStatusFilter = InvoiceStatus | "all";

interface InvoiceView {
  data: Invoice[];
  meta: PaginationMeta;
}

const DEFAULT_PAGE_SIZE = 20;

export function useInvoices() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<InvoiceStatusFilter>("all");
  const [view, setView] = useState<InvoiceView | null>(null);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  const debouncedSearch = useDebouncedValue(searchInput.trim(), 300);

  // Reset pagination as soon as filters change. Adjusting state during render
  // avoids a cascading effect and matches the other list hooks.
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
    let active = true;

    listInvoices(
      {
        page,
        limit: pageSize,
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
        ...(statusFilter !== "all" ? { status: statusFilter } : {}),
      },
      { signal: controller.signal },
    )
      .then((result) => {
        if (!active) return;
        setView(result);
        setError(null);
      })
      .catch((loadError: unknown) => {
        if (!active || controller.signal.aborted) return;
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load invoices.",
        );
      })
      .finally(() => {
        if (active) {
          setIsFetching(false);
        }
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [page, pageSize, debouncedSearch, statusFilter, nonce]);

  const refresh = useCallback(() => {
    setIsFetching(true);
    setNonce((value) => value + 1);
  }, []);

  const clearFilters = useCallback(() => {
    setIsFetching(true);
    setSearchInput("");
    setStatusFilter("all");
    setPage(1);
  }, []);

  const changeStatusFilter = useCallback((next: InvoiceStatusFilter) => {
    setIsFetching(true);
    setStatusFilter(next);
  }, []);

  const changePage = useCallback((next: number) => {
    setIsFetching(true);
    setPage(next);
  }, []);

  const changePageSize = useCallback((next: number) => {
    setIsFetching(true);
    setPageSize(next);
  }, []);

  const meta = useMemo<PaginationMeta>(
    () =>
      view?.meta ?? {
        page,
        limit: pageSize,
        total: 0,
        totalPages: 1,
      },
    [view, page, pageSize],
  );

  return {
    invoices: view?.data ?? [],
    meta,
    isFetching,
    error,
    searchInput,
    setSearchInput,
    statusFilter,
    setStatusFilter: changeStatusFilter,
    page,
    pageSize,
    setPage: changePage,
    setPageSize: changePageSize,
    refresh,
    clearFilters,
    hasActiveFilters: searchInput.trim().length > 0 || statusFilter !== "all",
  };
}
