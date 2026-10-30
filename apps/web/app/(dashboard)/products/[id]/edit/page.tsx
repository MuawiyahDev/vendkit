import type { Metadata } from "next";

import { ProductEditorPage } from "@/features/products/components/product-editor-page";

export const metadata: Metadata = {
  title: "Edit product",
};

interface EditProductRoutePageProps {
  params: Promise<{ id: string }>;
}

export default async function EditProductRoutePage({
  params,
}: EditProductRoutePageProps) {
  const { id } = await params;
  return <ProductEditorPage productId={id} />;
}
