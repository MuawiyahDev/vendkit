import type { Metadata } from "next";

import { InvoicesPage } from "@/features/invoices/components/invoices-page";

export const metadata: Metadata = {
  title: "Invoices",
};

export default function InvoicesRoutePage() {
  return <InvoicesPage />;
}
