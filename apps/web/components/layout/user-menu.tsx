"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, LoaderCircle, LogOut } from "lucide-react";

import { signOut } from "@/features/auth/api/auth-api";
import { useSession } from "@/features/auth/session/session-provider";
import {
  SIDEBAR_CONTROL_INTERACTION,
  SIDEBAR_ROW_PADDING,
} from "@/components/layout/sidebar/sidebar.constants";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type UserMenuVariant = "header" | "sidebar";

interface UserMenuProps {
  /**
   * "header" renders the compact account action for the top bar,
   * "sidebar" renders the full-width profile row for the sidebar footer.
   */
  variant?: UserMenuVariant;
  /** Avatar-only trigger used by the collapsed sidebar rail. */
  collapsed?: boolean;
  className?: string;
}

export function UserMenu({
  variant = "header",
  collapsed = false,
  className,
}: UserMenuProps) {
  const { status, user } = useSession();
  const router = useRouter();
  const [isSigningOut, startSignOutTransition] = useTransition();
  const [open, setOpen] = useState(false);

  const isSidebar = variant === "sidebar";

  if (status === "loading") {
    return (
      <Skeleton
        aria-hidden="true"
        className={cn(
          isSidebar && "bg-sidebar-accent",
          isSidebar ? "h-9 w-full" : "size-8 rounded-full",
          className,
        )}
      />
    );
  }

  if (!user) {
    return null;
  }

  const displayName = user.name?.trim() || user.email;
  const initials = getInitials(displayName);

  function handleSignOut() {
    startSignOutTransition(async () => {
      try {
        await signOut();
      } catch {
        // The local session is cleared even if the API is unreachable.
      }
      setOpen(false);
      router.replace("/sign-in");
      router.refresh();
    });
  }

  const avatar = (
    <Avatar className={cn(isSidebar ? "size-7" : "size-6", "shrink-0")}>
      <AvatarFallback
        className={cn(isSidebar && "bg-sidebar-accent text-sidebar-foreground")}
      >
        {initials}
      </AvatarFallback>
    </Avatar>
  );

  const trigger =
    isSidebar && collapsed ? (
      <Button
        variant="ghost"
        aria-label={`Account menu for ${displayName}`}
        className={cn(
          "h-9 w-full justify-center px-0",
          SIDEBAR_CONTROL_INTERACTION,
          className,
        )}
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="flex items-center">{avatar}</span>
          </TooltipTrigger>
          <TooltipContent side="right" align="center">
            {displayName}
          </TooltipContent>
        </Tooltip>
      </Button>
    ) : isSidebar ? (
      <Button
        variant="ghost"
        aria-label={`Account menu for ${displayName}`}
        className={cn(
          "h-9 w-full gap-2.5",
          SIDEBAR_ROW_PADDING,
          SIDEBAR_CONTROL_INTERACTION,
          className,
        )}
      >
        {avatar}
        <span className="min-w-0 flex-1 truncate text-left text-sm font-medium">
          {displayName}
        </span>
        <ChevronDown
          className="size-3.5 shrink-0 text-sidebar-foreground/45"
          aria-hidden="true"
        />
      </Button>
    ) : (
      <Button
        variant="ghost"
        className={cn("h-9 gap-2 px-2", className)}
        aria-label={`Account menu for ${displayName}`}
      >
        {avatar}
        <span className="hidden max-w-32 truncate text-sm font-medium sm:inline">
          {displayName}
        </span>
      </Button>
    );

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent align={isSidebar ? "start" : "end"} className="w-60">
        <DropdownMenuLabel className="gap-0.5 pr-8 font-normal">
          <span className="block truncate text-sm font-medium">
            {displayName}
          </span>
          <span className="text-muted-foreground block truncate text-xs">
            {user.email}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          disabled={isSigningOut}
          onSelect={(event) => {
            event.preventDefault();
            handleSignOut();
          }}
        >
          {isSigningOut ? (
            <LoaderCircle className="animate-spin" aria-hidden="true" />
          ) : (
            <LogOut aria-hidden="true" />
          )}
          {isSigningOut ? "Signing out…" : "Sign out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function getInitials(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return "?";
  }
  if (parts.length === 1) {
    return (parts[0] ?? "").slice(0, 2).toUpperCase();
  }
  return `${(parts[0] ?? "").charAt(0)}${(parts[parts.length - 1] ?? "").charAt(0)}`.toUpperCase();
}
