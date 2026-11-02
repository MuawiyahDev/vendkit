import type { Metadata } from "next";

import { OrderEditorPage } from "@/features/orders/components/order-editor-page";

export const metadata: Metadata = {
  title: "Edit order",
};

interface EditOrderRoutePageProps {
  params: Promise<{ id: string }>;
}

export default async function EditOrderRoutePage({
  params,
}: EditOrderRoutePageProps) {
  const { id } = await params;
  return <OrderEditorPage orderId={id} />;
}
