"use client";

import { useDefaultPhoneCountry } from "@/hooks/use-default-phone-country";

/**
 * Country used to interpret locally formatted order phone numbers for the
 * WhatsApp flow. Shared with every other phone field in the app.
 */
export function useWhatsAppDefaultCountry(): string {
  return useDefaultPhoneCountry() ?? "";
}
