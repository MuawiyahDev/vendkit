"use client";

import { useEffect, useState } from "react";

import { getSettings } from "@/features/settings/api/settings-api";

import { guessBrowserCountry, toSupportedCountry } from "../whatsapp.utils";

/**
 * Prefers the saved regional default country and falls back to the browser
 * region until settings load. Only used to interpret local-format numbers;
 * nothing is persisted.
 */
export function useWhatsAppDefaultCountry(): string {
  const [country, setCountry] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    const browserCountry = guessBrowserCountry();

    if (browserCountry) {
      // Defer so the fallback does not trigger a synchronous cascading render.
      queueMicrotask(() => {
        if (!controller.signal.aborted) {
          setCountry((current) => current || browserCountry);
        }
      });
    }

    void (async () => {
      try {
        const settings = await getSettings({ signal: controller.signal });
        const regionalCountry = toSupportedCountry(
          settings.regional.defaultCountry,
        );

        if (regionalCountry && !controller.signal.aborted) {
          setCountry(regionalCountry);
        }
      } catch {
        // Keep the browser fallback; the composer still accepts + numbers.
      }
    })();

    return () => controller.abort();
  }, []);

  return country;
}
