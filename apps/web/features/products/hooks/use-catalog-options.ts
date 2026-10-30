"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { listBrands, type Brand } from "@/features/brands/api/brands-api";
import {
  listCategories,
  type Category,
} from "@/features/categories/api/categories-api";
import { ApiError } from "@/lib/api/client";

const OPTIONS_PAGE_SIZE = 100;

export type CatalogOptionsView =
  | { status: "loading" }
  | { status: "success"; categories: Category[]; brands: Brand[] }
  | { status: "error"; message: string };

/**
 * Loads the category and brand lists used by product filters and form
 * selects. Both lists are fetched from their real endpoints without an
 * active-status filter so existing products keep a valid selection even
 * when their category or brand has been deactivated.
 */
export function useCatalogOptions() {
  const [view, setView] = useState<CatalogOptionsView>({ status: "loading" });
  const [fetchNonce, setFetchNonce] = useState(0);
  const requestIdRef = useRef(0);

  useEffect(() => {
    const controller = new AbortController();
    const requestId = ++requestIdRef.current;

    void (async () => {
      try {
        const [categories, brands] = await Promise.all([
          listCategories({ limit: OPTIONS_PAGE_SIZE }, {
            signal: controller.signal,
          }),
          listBrands({ limit: OPTIONS_PAGE_SIZE }, {
            signal: controller.signal,
          }),
        ]);

        if (requestIdRef.current !== requestId) {
          return;
        }
        setView({
          status: "success",
          categories: categories.data,
          brands: brands.data,
        });
      } catch (error) {
        if (controller.signal.aborted || requestIdRef.current !== requestId) {
          return;
        }
        setView({
          status: "error",
          message:
            error instanceof ApiError
              ? error.message
              : "Something went wrong while loading categories and brands.",
        });
      }
    })();

    return () => controller.abort();
  }, [fetchNonce]);

  const refresh = useCallback(() => {
    setView({ status: "loading" });
    setFetchNonce((nonce) => nonce + 1);
  }, []);

  return { view, refresh };
}
