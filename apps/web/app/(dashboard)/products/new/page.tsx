import type { Metadata } from "next";

import { ProductEditorPage } from "@/features/products/components/product-editor-page";

export const metadata: Metadata = {
  title: "Add product",
};

export default function AddProductRoutePage() {
  return <ProductEditorPage />;
}
