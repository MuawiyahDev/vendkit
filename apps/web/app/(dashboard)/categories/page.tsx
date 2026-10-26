import type { Metadata } from "next";

import { CategoriesPage } from "@/features/categories/components/categories-page";

export const metadata: Metadata = {
  title: "Categories",
};

export default function CategoriesRoutePage() {
  return <CategoriesPage />;
}
