import type { Metadata } from "next";

import { CustomerDetailsPage } from "@/features/customers/components/customer-details-page";

export const metadata: Metadata = {
  title: "Customer details",
};

export default function CustomerDetailsRoutePage() {
  return <CustomerDetailsPage />;
}
