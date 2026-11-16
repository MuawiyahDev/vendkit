"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { ApiError } from "@/lib/api/client";

import {
  listImages,
  type ImageListResponse,
  type ImageSortField,
  type ImageSortOrder,
  type ImageTypeFilter,
} from "../api/images-api";
import { DEFAULT_IMAGE_SORT } from "../images.constants";

const SEARCH_DEBOUNCE_MS = 300;

export const DEFAULT_IMAGE_PAGE_SIZE = 24;

export type ImageLibraryView =
  | { status: "loading" }
  | { status: "success"; data: ImageListResponse }
  | { status: "error"; message: string };

/**
 * Owns the image library list query state (debounced search, pagination)
 * and keeps responses ordered so stale requests never overwrite newer
 * results.
 */
export function useImages() {
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(
    searchInput.trim(),
    SEARCH_DEBOUNCE_MS,
  );
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_IMAGE_PAGE_SIZE);
  const [typeFilter, setTypeFilterState] = useState<ImageTypeFilter>("all");
  const [sortBy, setSortByState] = useState<ImageSortField>(
    DEFAULT_IMAGE_SORT.sortBy,
  );
  const [sortOrder, setSortOrderState] = useState<ImageSortOrder>(
    DEFAULT_IMAGE_SORT.sortOrder,
  );
  const [view, setView] = useState<ImageLibraryView>({ status: "loading" });
  const [isFetching, setIsFetching] = useState(true);
  const [fetchNonce, setFetchNonce] = useState(0);
  const requestIdRef = useRef(0);

  // Reset pagination as soon as the query changes (render-time adjustment,
  // avoiding a cascading effect-driven setState).
  const [prevQuery, setPrevQuery] = useState({
    debouncedSearch,
    pageSize,
    typeFilter,
    sortBy,
    sortOrder,
  });
  if (
    prevQuery.debouncedSearch !== debouncedSearch ||
    prevQuery.pageSize !== pageSize ||
    prevQuery.typeFilter !== typeFilter ||
    prevQuery.sortBy !== sortBy ||
    prevQuery.sortOrder !== sortOrder
  ) {
    setPrevQuery({
      debouncedSearch,
      pageSize,
      typeFilter,
      sortBy,
      sortOrder,
    });
    setPage(1);
    setIsFetching(true);
  }

  useEffect(() => {
    const controller = new AbortController();
    const requestId = ++requestIdRef.current;

    void (async () => {
      try {
        const result = await listImages(
          {
            page,
            limit: pageSize,
            search: debouncedSearch || undefined,
            mimeType: typeFilter === "all" ? undefined : typeFilter,
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
              : "Something went wrong while loading images.",
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
    sortBy,
    sortOrder,
    fetchNonce,
  ]);

  const setTypeFilter = useCallback((next: ImageTypeFilter) => {
    setIsFetching(true);
    setTypeFilterState(next);
  }, []);

  const setSort = useCallback(
    (next: { sortBy: ImageSortField; sortOrder: ImageSortOrder }) => {
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
    setTypeFilterState("all");
  }, []);

  return {
    view,
    isFetching,
    searchInput,
    debouncedSearch,
    setSearchInput,
    typeFilter,
    setTypeFilter,
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
