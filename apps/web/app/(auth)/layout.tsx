import { redirect } from "next/navigation";

import { BrandLogo } from "@/components/shared/brand-logo";
import { getSessionGateState } from "@/lib/server/session-gate";

export default async function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const sessionState = await getSessionGateState();
  if (sessionState === "authenticated") {
    redirect("/dashboard");
  }

  return (
    <main className="bg-background flex min-h-dvh flex-col items-center justify-center gap-8 px-4 py-10">
      <BrandLogo className="justify-center" />
      <div className="w-full max-w-sm">{children}</div>
      <p className="text-muted-foreground text-center text-xs">
        Self-hosted order management for social sellers
      </p>
    </main>
  );
}
