import type { DashboardPreset } from "./dashboard.types";

export const DEFAULT_DASHBOARD_PRESET = "last-7-days" satisfies Exclude<
  DashboardPreset,
  "custom"
>;

export const DASHBOARD_PRESET_LABELS: Record<DashboardPreset, string> = {
  today: "Today",
  yesterday: "Yesterday",
  "last-7-days": "Last 7 days",
  "last-30-days": "Last 30 days",
  "this-month": "This month",
  "last-month": "Last month",
  custom: "Custom range",
};

export const DASHBOARD_PRESET_OPTIONS = [
  "today",
  "yesterday",
  "last-7-days",
  "last-30-days",
  "this-month",
  "last-month",
] as const satisfies readonly DashboardPreset[];
