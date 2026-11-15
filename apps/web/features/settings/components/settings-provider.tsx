"use client";

import * as React from "react";

import { useSession } from "@/features/auth/session/session-provider";
import { ApiError } from "@/lib/api/client";

import { getSettings } from "../api/settings-api";
import {
  SETTINGS_DATA_KEY,
  type AllSettings,
  type SettingsCategory,
  type SettingsResponseMap,
} from "../settings.types";

export type SettingsLoadState =
  | { status: "loading" }
  | { status: "success"; data: AllSettings }
  | { status: "error"; message: string };

interface SettingsDataContextValue {
  state: SettingsLoadState;
  data: AllSettings | null;
  canEdit: boolean;
  isDirty: boolean;
  setDirty: (dirty: boolean) => void;
  updateCategory: <C extends SettingsCategory>(
    category: C,
    value: SettingsResponseMap[C],
  ) => void;
  refresh: () => void;
}

const SettingsDataContext = React.createContext<SettingsDataContextValue | null>(
  null,
);

export function useSettingsData(): SettingsDataContextValue {
  const context = React.useContext(SettingsDataContext);
  if (!context) {
    throw new Error("useSettingsData must be used within SettingsProvider");
  }
  return context;
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const { user, status: sessionStatus, refresh: refreshSession } = useSession();
  const sessionStatusOnMount = React.useRef(sessionStatus);
  const [state, setState] = React.useState<SettingsLoadState>({
    status: "loading",
  });
  const [isDirty, setDirtyState] = React.useState(false);
  const [fetchNonce, setFetchNonce] = React.useState(0);

  // The dashboard shell keeps the session in memory. If an account was
  // promoted to admin in another session, refresh here so the edit controls
  // reflect the current role without requiring a full page reload.
  React.useEffect(() => {
    if (sessionStatusOnMount.current === "authenticated") {
      refreshSession();
    }
  }, [refreshSession]);

  React.useEffect(() => {
    const controller = new AbortController();

    void (async () => {
      try {
        const data = await getSettings({ signal: controller.signal });
        if (controller.signal.aborted) {
          return;
        }
        setState({ status: "success", data });
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }
        setState({
          status: "error",
          message:
            error instanceof ApiError
              ? error.message
              : "Something went wrong while loading settings.",
        });
      }
    })();

    return () => controller.abort();
  }, [fetchNonce]);

  const setDirty = React.useCallback((dirty: boolean) => {
    setDirtyState(dirty);
  }, []);

  const updateCategory = React.useCallback(
    <C extends SettingsCategory>(
      category: C,
      value: SettingsResponseMap[C],
    ): void => {
      const key = SETTINGS_DATA_KEY[category];
      setState((current) => {
        if (current.status !== "success") {
          return current;
        }

        return {
          status: "success",
          data: { ...current.data, [key]: value } as AllSettings,
        };
      });
    },
    [],
  );

  const refresh = React.useCallback(() => {
    setState({ status: "loading" });
    setFetchNonce((nonce) => nonce + 1);
  }, []);

  const value = React.useMemo<SettingsDataContextValue>(
    () => ({
      state,
      data: state.status === "success" ? state.data : null,
      canEdit: user?.role === "ADMIN",
      isDirty,
      setDirty,
      updateCategory,
      refresh,
    }),
    [state, user?.role, isDirty, setDirty, updateCategory, refresh],
  );

  return (
    <SettingsDataContext.Provider value={value}>
      {children}
    </SettingsDataContext.Provider>
  );
}

export function useSettingsCategory<C extends SettingsCategory>(
  category: C,
): SettingsResponseMap[C] {
  const { data } = useSettingsData();
  if (!data) {
    throw new Error("Settings have not loaded yet");
  }

  const key = SETTINGS_DATA_KEY[category];
  return data[key] as unknown as SettingsResponseMap[C];
}
