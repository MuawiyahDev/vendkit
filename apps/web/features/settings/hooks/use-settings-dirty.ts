"use client";

import { useEffect } from "react";

import { useSettingsData } from "../components/settings-provider";

/** Publishes the active form's dirty state to the settings shell guard. */
export function useSettingsDirty(isDirty: boolean): void {
  const { setDirty } = useSettingsData();

  useEffect(() => {
    setDirty(isDirty);
    return () => setDirty(false);
  }, [isDirty, setDirty]);
}
