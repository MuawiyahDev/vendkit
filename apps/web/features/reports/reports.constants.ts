import {
  Camera,
  Globe2,
  MessageCircle,
  MoreHorizontal,
  Music2,
  Phone,
  Store,
  ThumbsUp,
  type LucideIcon,
} from "lucide-react";

import type {
  OrderSource,
  OrderStatus,
} from "@/features/orders/api/orders-api";

/** Quick date ranges offered above the report. */
export const REPORT_RANGE_PRESETS = [
  { id: "7d", label: "7 days" },
  { id: "30d", label: "30 days" },
  { id: "90d", label: "90 days" },
  { id: "this-month", label: "This month" },
  { id: "last-month", label: "Last month" },
] as const;

export type ReportRangePresetId =
  (typeof REPORT_RANGE_PRESETS)[number]["id"];

/**
 * Channel icons. Brand marks are intentionally not used; a generic icon per
 * channel keeps the report readable without introducing third-party logos.
 */
export const ORDER_SOURCE_ICONS: Record<OrderSource, LucideIcon> = {
  FACEBOOK: ThumbsUp,
  INSTAGRAM: Camera,
  WHATSAPP: MessageCircle,
  TIKTOK: Music2,
  WEBSITE: Globe2,
  PHONE: Phone,
  WALK_IN: Store,
  OTHER: MoreHorizontal,
};

/**
 * Status colors follow the same meaning used by status badges elsewhere:
 * amber for pending, blue for in-progress, green for delivered, red for
 * cancelled. The shades keep neighbouring statuses distinguishable.
 */
export const ORDER_STATUS_TONES: Record<
  OrderStatus,
  { dot: string; bar: string }
> = {
  PENDING: { dot: "bg-warning", bar: "bg-warning" },
  CONFIRMED: { dot: "bg-info/60", bar: "bg-info/60" },
  PROCESSING: { dot: "bg-info", bar: "bg-info" },
  SHIPPED: { dot: "bg-primary", bar: "bg-primary" },
  DELIVERED: { dot: "bg-success", bar: "bg-success" },
  CANCELLED: { dot: "bg-destructive", bar: "bg-destructive" },
};
