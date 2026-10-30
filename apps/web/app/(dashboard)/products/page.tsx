import type { Metadata } from "next";

import { ProductsPage } from "@/features/products/components/products-page";

export const metadata: Metadata = {
  title: "Products",
};

export default function ProductsRoutePage() {
  return <ProductsPage />;
}
