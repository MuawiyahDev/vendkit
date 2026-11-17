import type { Metadata } from "next";

import { InventoryPage } from "@/features/inventory/components/inventory-page";

export const metadata: Metadata = {
  title: "Inventory",
};

export default function InventoryRoutePage() {
  return <InventoryPage />;
}
