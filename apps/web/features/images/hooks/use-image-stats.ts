"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { ApiError } from "@/lib/api/client";

import { getImageStats, type ImageLibraryStats } from "../api/images-api";

export type ImageStatsView =
  | { status: "loading" }
  | { status: "success"; data: ImageLibraryStats }
  | { status: "error"; message: string };

/**
 * Loads aggregate media-library statistics. `refreshToken` lets the parent
 * request a fresh snapshot after uploads or deletions without making the
 * list itself depend on statistics.
 */
export function useImageStats(refreshToken: number) {
  const [view, setView] = useState<ImageStatsView>({ status: "loading" });
  const [fetchNonce, setFetchNonce] = useState(0);
  const requestIdRef = useRef(0);

  useEffect(() => {
    const controller = new AbortController();
    const requestId = ++requestIdRef.current;

    void (async () => {
      try {
        const data = await getImageStats({ signal: controller.signal });
        if (requestIdRef.current === requestId) {
          setView({ status: "success", data });
        }
      } catch (error) {
        if (controller.signal.aborted || requestIdRef.current !== requestId) {
          return;
        }
        setView({
          status: "error",
          message:
            error instanceof ApiError
              ? error.message
              : "Unable to load media statistics.",
        });
      }
    })();

    return () => controller.abort();
  }, [refreshToken, fetchNonce]);

  const refresh = useCallback(() => {
    setFetchNonce((nonce) => nonce + 1);
  }, []);

  return { view, refresh };
}
