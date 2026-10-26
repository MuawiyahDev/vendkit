import type { Metadata } from "next";

import { BrandsPage } from "@/features/brands/components/brands-page";

export const metadata: Metadata = {
  title: "Brands",
};

export default function BrandsRoutePage() {
  return <BrandsPage />;
}
