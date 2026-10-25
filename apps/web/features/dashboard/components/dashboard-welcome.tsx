"use client";

import { useSession } from "@/features/auth/session/session-provider";

export function DashboardWelcome() {
  const { user } = useSession();
  const firstName = user?.name?.trim().split(" ")[0];

  return (
    <header className="flex flex-col gap-1.5">
      <h1 className="text-2xl font-semibold tracking-[-0.02em]">
        Welcome back{firstName ? `, ${firstName}` : ""}
      </h1>
      <p className="text-muted-foreground max-w-prose text-sm leading-relaxed">
        This is your workspace for running your social-commerce business.
        Orders, products, and customers will show up here as you start selling.
      </p>
    </header>
  );
}
