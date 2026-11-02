import type { Metadata } from "next";

import { OrderDetailsPage } from "@/features/orders/components/order-details-page";

export const metadata: Metadata = {
  title: "Order details",
};

export default function OrderDetailsRoutePage() {
  return <OrderDetailsPage />;
}
