import {
  Bell,
  Building2,
  CreditCard,
  DatabaseBackup,
  FileText,
  Globe2,
  Percent,
  ShoppingCart,
  Truck,
  type LucideIcon,
} from "lucide-react";

import type { SettingsSection } from "../settings.types";

export interface SettingsCategoryMeta {
  value: SettingsSection;
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
}

export const SETTINGS_CATEGORY_META: readonly SettingsCategoryMeta[] = [
  {
    value: "business-profile",
    title: "Business profile",
    description:
      "Your business identity, contact details, and the address printed on documents.",
    href: "/settings/business-profile",
    icon: Building2,
  },
  {
    value: "invoice",
    title: "Invoice",
    description:
      "Invoice branding, numbering, defaults, and how line items are presented.",
    href: "/settings/invoice",
    icon: FileText,
  },
  {
    value: "regional",
    title: "Regional",
    description:
      "Currency, country, timezone, language, and how amounts and dates are formatted.",
    href: "/settings/regional",
    icon: Globe2,
  },
  {
    value: "tax",
    title: "Tax",
    description:
      "Default tax name and rate, pricing mode, and invoice tax presentation.",
    href: "/settings/tax",
    icon: Percent,
  },
  {
    value: "order",
    title: "Orders",
    description:
      "Numbering, default status, notes, and editing rules for new orders.",
    href: "/settings/order",
    icon: ShoppingCart,
  },
  {
    value: "payment",
    title: "Payments",
    description:
      "Supported payment methods, the default method, and bank transfer details.",
    href: "/settings/payment",
    icon: CreditCard,
  },
  {
    value: "shipping",
    title: "Shipping",
    description:
      "Default shipping charges, free shipping threshold, and delivery instructions.",
    href: "/settings/shipping",
    icon: Truck,
  },
  {
    value: "notification",
    title: "Notifications",
    description:
      "Business notification email, event preferences, and sender details.",
    href: "/settings/notification",
    icon: Bell,
  },
  {
    value: "backup",
    title: "Backup & Restore",
    description:
      "Download a complete copy of the business data or restore a previous backup.",
    href: "/settings/backup",
    icon: DatabaseBackup,
  },
] as const;

export function getSettingsCategoryMeta(
  category: SettingsSection,
): SettingsCategoryMeta {
  const meta = SETTINGS_CATEGORY_META.find((item) => item.value === category);
  if (!meta) {
    throw new Error(`Unknown settings category: ${category}`);
  }
  return meta;
}
