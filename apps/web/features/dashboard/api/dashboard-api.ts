import { apiFetch } from "@/lib/api/client";

import type {
  DashboardRangeSelection,
  DashboardResponse,
} from "../dashboard.types";

interface RequestOptions {
  signal?: AbortSignal;
}

function toSearchParams(selection: DashboardRangeSelection): URLSearchParams {
  const params = new URLSearchParams({ preset: selection.preset });

  if (selection.preset === "custom") {
    params.set("from", selection.from);
    params.set("to", selection.to);
  }

  return params;
}

export async function getDashboard(
  selection: DashboardRangeSelection,
  { signal }: RequestOptions = {},
): Promise<DashboardResponse> {
  const query = toSearchParams(selection).toString();
  return apiFetch<DashboardResponse>(`/api/dashboard?${query}`, { signal });
}
