import { apiFetch } from "@/lib/api/client";

import type {
  AllSettings,
  SettingsCategory,
  SettingsResponseMap,
  SettingsUpdateInputMap,
} from "../settings.types";

export async function getSettings({
  signal,
}: { signal?: AbortSignal } = {}): Promise<AllSettings> {
  return apiFetch<AllSettings>("/api/settings", { signal });
}

export async function updateSettings<C extends SettingsCategory>(
  category: C,
  input: SettingsUpdateInputMap[C],
): Promise<SettingsResponseMap[C]> {
  return apiFetch<SettingsResponseMap[C]>(`/api/settings/${category}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function resetSettings<C extends SettingsCategory>(
  category: C,
): Promise<SettingsResponseMap[C]> {
  return apiFetch<SettingsResponseMap[C]>(`/api/settings/${category}/reset`, {
    method: "POST",
    body: JSON.stringify({}),
  });
}
