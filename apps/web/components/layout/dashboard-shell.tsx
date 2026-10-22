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
      <AppSidebar collapsed={collapsed} className="hidden lg:flex" />
      <div className="flex min-w-0 flex-1 flex-col">
        <DashboardHeader
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed(!collapsed)}
        />
        <main className="flex-1">
          <div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6 md:py-8 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
