import type { Metadata } from "next";

import { CustomersPage } from "@/features/customers/components/customers-page";

export const metadata: Metadata = {
  title: "Customers",
};

export default function CustomersRoutePage() {
  return <CustomersPage />;
}
