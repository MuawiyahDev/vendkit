"use client";

import { AlertCircle, ShieldAlert } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { useSession } from "@/features/auth/session/session-provider";

import { Breadcrumb } from "@/components/shared/breadcrumb";
import { PageHeader } from "@/components/shared/page-header";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { isSettingsCategory, type SettingsCategory } from "../settings.types";
import { SettingsCategoryNav } from "./settings-category-nav";
import { useSettingsData } from "./settings-provider";

function SettingsLoadingSkeleton() {
  return (
    <div
      className="flex flex-col gap-5"
      role="status"
      aria-label="Loading settings"
    >
      <span className="sr-only">Loading settings…</span>
      <Skeleton className="h-8 w-56" />
      <div className="rounded-xl border p-6">
        <div className="flex flex-col gap-5">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-9 w-full" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Loading, navigation, and unsaved-change guard for the settings area.
 * Settings are loaded once in `SettingsProvider`, so switching categories
 * does not trigger another request.
 */
export function SettingsShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { status: sessionStatus } = useSession();
  const { state, canEdit, isDirty, setDirty, refresh } = useSettingsData();
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);

  const activeCategory = useMemo<SettingsCategory>(() => {
    const segment = pathname.split("/")[2] ?? "";
    return isSettingsCategory(segment) ? segment : "business-profile";
  }, [pathname]);

  useEffect(() => {
    if (!isDirty) {
      return;
    }

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  function navigate(href: string) {
    if (href === pathname) {
      return;
    }

    if (isDirty) {
      setPendingHref(href);
      setLeaveDialogOpen(true);
      return;
    }

    router.push(href);
  }

  function confirmLeave() {
    const href = pendingHref;
    setLeaveDialogOpen(false);
    setPendingHref(null);
    setDirty(false);
    if (href) {
      router.push(href);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <Breadcrumb
          items={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Settings" },
          ]}
        />
        <PageHeader
          title="Settings"
          description="Manage the business details, defaults, and document settings used throughout VendKit."
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[14rem_minmax(0,1fr)] lg:items-start">
        <SettingsCategoryNav activeCategory={activeCategory} onNavigate={navigate} />

        <div className="flex min-w-0 flex-col gap-5">
          {sessionStatus !== "loading" && !canEdit ? (
            <Alert className="border-info/25 bg-info-soft text-info-soft-foreground [&>svg]:text-info-soft-foreground">
              <ShieldAlert aria-hidden="true" />
              <AlertDescription className="text-info-soft-foreground">
                You can review these settings, but only administrators can
                change them.
              </AlertDescription>
            </Alert>
          ) : null}

          {state.status === "loading" || sessionStatus === "loading" ? (
            <SettingsLoadingSkeleton />
          ) : null}

          {sessionStatus !== "loading" && state.status === "error" ? (
            <div className="flex flex-col items-start gap-3 rounded-xl border border-destructive/20 bg-destructive-soft/40 p-6">
              <Alert variant="destructive" className="w-full">
                <AlertCircle aria-hidden="true" />
                <AlertDescription>{state.message}</AlertDescription>
              </Alert>
              <Button type="button" variant="outline" onClick={refresh}>
                Try again
              </Button>
            </div>
          ) : null}

          {state.status === "success" && sessionStatus !== "loading"
            ? children
            : null}
        </div>
      </div>

      <AlertDialog
        open={leaveDialogOpen}
        onOpenChange={(open) => {
          setLeaveDialogOpen(open);
          if (!open) {
            setPendingHref(null);
          }
        }}
      >
        <AlertDialogContent className="gap-5 sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Discard unsaved changes?</AlertDialogTitle>
            <AlertDialogDescription className="leading-relaxed">
              You have edits that have not been saved. Leaving this settings
              category will discard them.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep editing</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={confirmLeave}>
              Discard and leave
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
