import {
  isSupportedCountry,
  parsePhoneNumberFromString,
  type CountryCode,
} from "libphonenumber-js";

const NON_DIGITS = /\D/g;
const INTERNATIONAL_DIALING_PREFIX = "00";

/**
 * Returns a supported ISO region for a raw value, or `undefined` when the
 * value is missing or not recognised by libphonenumber.
 */
export function toSupportedCountry(
  value: string | null | undefined,
): CountryCode | undefined {
  if (!value) {
    return undefined;
  }

  const normalized = value.trim().toUpperCase();
  return isSupportedCountry(normalized) ? normalized : undefined;
}

/**
 * Uses the browser locale as a sensible fallback before the saved regional
 * setting has loaded (or when it cannot be fetched).
 */
export function guessBrowserCountry(): CountryCode | undefined {
  if (typeof navigator === "undefined") {
    return undefined;
  }

  const locales = [...(navigator.languages ?? []), navigator.language].filter(
    Boolean,
  );

  for (const locale of locales) {
    try {
      const region = new Intl.Locale(locale).region;
      if (region && isSupportedCountry(region)) {
        return region;
      }
    } catch {
      // Ignore malformed or unsupported browser locales.
    }
  }

  return undefined;
}

/**
 * Converts a stored phone number into the E.164 value expected by
 * `@/components/ui/phone-input`.
 *
 * Values without an international prefix are interpreted using the configured
 * default country, which mirrors how the backend accepts local-format numbers.
 * Existing values are never rewritten unless the user edits the field.
 */
export function toPhoneInputValue(
  value: string | null | undefined,
  defaultCountry?: string | null,
): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) {
    return undefined;
  }

  if (trimmed.startsWith("+")) {
    const digits = trimmed.replace(NON_DIGITS, "");
    return digits ? `+${digits}` : undefined;
  }

  if (trimmed.startsWith(INTERNATIONAL_DIALING_PREFIX)) {
    const digits = trimmed.replace(NON_DIGITS, "").slice(
      INTERNATIONAL_DIALING_PREFIX.length,
    );
    return digits ? `+${digits}` : undefined;
  }

  const country = toSupportedCountry(defaultCountry);
  if (!country) {
    return undefined;
  }

  return parsePhoneNumberFromString(trimmed, country)?.number;
}
