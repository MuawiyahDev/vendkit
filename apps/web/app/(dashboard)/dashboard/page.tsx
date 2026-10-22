import { ReceiptText } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { DashboardWelcome } from "@/features/dashboard/components/dashboard-welcome";

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-8">
      <DashboardWelcome />
      <EmptyState
        icon={ReceiptText}
        title="Your orders will appear here"
        description="Order management, products, and customers are coming to this workspace. Connect your catalog and start tracking orders in one place."
      />
    </div>
  );
}
