"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { useSession } from "@/features/auth/session/session-provider";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { useStoredBoolean } from "@/hooks/use-stored-boolean";

const SIDEBAR_COLLAPSED_KEY = "openorder:sidebar-collapsed";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { status } = useSession();
  const [collapsed, setCollapsed] = useStoredBoolean(SIDEBAR_COLLAPSED_KEY);

  React.useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/sign-in");
    }
  }, [status, router]);

  return (
    <div className="bg-background flex min-h-dvh w-full">
      <AppSidebar
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(!collapsed)}
        className="hidden lg:flex"
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <DashboardHeader />
        <main className="flex-1">
          <div className="w-full px-4 py-6 md:px-8 md:py-8 lg:px-10 xl:px-12">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
