"use client";

import * as React from "react";

import { fetchSession } from "@/features/auth/api/auth-api";
import type { SessionUser } from "@/lib/auth/types";

type SessionStatus = "loading" | "authenticated" | "unauthenticated";

interface SessionState {
  status: SessionStatus;
  user: SessionUser | null;
}

const SessionContext = React.createContext<SessionState | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<SessionState>({
    status: "loading",
    user: null,
  });

  React.useEffect(() => {
    let cancelled = false;

    fetchSession()
      .then((user) => {
        if (cancelled) return;
        setState(
          user
            ? { status: "authenticated", user }
            : { status: "unauthenticated", user: null },
        );
      })
      .catch(() => {
        if (cancelled) return;
        setState({ status: "unauthenticated", user: null });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <SessionContext.Provider value={state}>{children}</SessionContext.Provider>
  );
}

export function useSession(): SessionState {
  const context = React.useContext(SessionContext);
  if (!context) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
}
