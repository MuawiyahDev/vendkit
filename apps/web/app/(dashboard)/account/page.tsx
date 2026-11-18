import type { Metadata } from "next";

import { AccountPage } from "@/features/account/components/account-page";

export const metadata: Metadata = {
  title: "Account",
};

export default function AccountRoutePage() {
  return <AccountPage />;
}
