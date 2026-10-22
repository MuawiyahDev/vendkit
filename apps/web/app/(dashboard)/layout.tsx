import { redirect } from "next/navigation";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { SessionProvider } from "@/features/auth/session/session-provider";
import { getSessionGateState } from "@/lib/server/session-gate";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const sessionState = await getSessionGateState();
  if (sessionState === "anonymous") {
    redirect("/sign-in");
  }

  return (
    <SessionProvider>
      <DashboardShell>{children}</DashboardShell>
    </SessionProvider>
  );
}
