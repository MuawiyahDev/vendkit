"use client";

import * as React from "react";

import { fetchSession } from "@/features/auth/api/auth-api";
import type { SessionUser } from "@/lib/auth/types";

type SessionStatus = "loading" | "authenticated" | "unauthenticated";

interface SessionState {
  status: SessionStatus;
  user: SessionUser | null;
}

interface SessionContextValue extends SessionState {
  /** Re-reads the session so role or profile changes are picked up. */
  refresh: () => void;
}

const SessionContext = React.createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<SessionState>({
    status: "loading",
    user: null,
  });
  const [refreshNonce, setRefreshNonce] = React.useState(0);

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
  }, [refreshNonce]);

  const refresh = React.useCallback(() => {
    setRefreshNonce((nonce) => nonce + 1);
  }, []);

  const value = React.useMemo<SessionContextValue>(
    () => ({ ...state, refresh }),
    [state, refresh],
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession(): SessionContextValue {
  const context = React.useContext(SessionContext);
  if (!context) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
}
