"use client";

import { useEffect, useState } from "react";
import type { CountryCode } from "libphonenumber-js";

import { getSettings } from "@/features/settings/api/settings-api";
import { guessBrowserCountry, toSupportedCountry } from "@/lib/phone";

let regionalCountry: CountryCode | undefined;
let regionalCountryResolved = false;
let regionalCountryRequest: Promise<CountryCode | undefined> | null = null;

function loadRegionalCountry(): Promise<CountryCode | undefined> {
  if (regionalCountryResolved) {
    return Promise.resolve(regionalCountry);
  }

  regionalCountryRequest ??= getSettings()
    .then((settings) => {
      regionalCountry = toSupportedCountry(settings.regional.defaultCountry);
      regionalCountryResolved = true;
      return regionalCountry;
    })
    .catch(() => undefined)
    .finally(() => {
      regionalCountryRequest = null;
    });

  return regionalCountryRequest;
}

/**
 * Country used to interpret locally formatted phone numbers.
 *
 * Prefers an explicitly configured regional country and otherwise loads the
 * saved regional setting, using the browser region until it resolves. Results
 * are cached for the session so every phone field shares one request.
 */
export function useDefaultPhoneCountry(
  configuredCountry?: string | null,
): CountryCode | undefined {
  const configured = toSupportedCountry(configuredCountry);
  const [detectedCountry, setDetectedCountry] = useState<CountryCode>();

  useEffect(() => {
    if (configured) {
      return;
    }

    let active = true;
    const browserCountry = guessBrowserCountry();

    if (browserCountry) {
      // Defer so the fallback does not trigger a synchronous cascading render.
      queueMicrotask(() => {
        if (active) {
          setDetectedCountry((current) => current ?? browserCountry);
        }
      });
    }

    void loadRegionalCountry().then((country) => {
      if (active && country) {
        setDetectedCountry(country);
      }
    });

    return () => {
      active = false;
    };
  }, [configured]);

  return configured ?? detectedCountry;
}
