import type { Metadata } from "next";

import { OrderEditorPage } from "@/features/orders/components/order-editor-page";

export const metadata: Metadata = {
  title: "Create order",
};

export default function CreateOrderRoutePage() {
  return <OrderEditorPage />;
}
