"use client";

import { useCallback, useState } from "react";

import { ApiError } from "@/lib/api/client";

import { resetSettings, updateSettings } from "../api/settings-api";
import type {
  SettingsCategory,
  SettingsResponseMap,
  SettingsUpdateInputMap,
} from "../settings.types";

interface UseSettingsMutationOptions<C extends SettingsCategory> {
  category: C;
  onSaved: (value: SettingsResponseMap[C]) => void;
  savedMessage?: string;
  restoredMessage?: string;
}

/**
 * Shared save/restore state for settings forms. Keeps API error handling and
 * feedback consistent across every category.
 */
export function useSettingsMutation<C extends SettingsCategory>({
  category,
  onSaved,
  savedMessage = "Settings saved.",
  restoredMessage = "Settings restored to their defaults.",
}: UseSettingsMutationOptions<C>) {
  const [isSaving, setIsSaving] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [restoreError, setRestoreError] = useState<string | null>(null);

  const save = useCallback(
    async (input: SettingsUpdateInputMap[C]) => {
      setIsSaving(true);
      setError(null);
      setSuccessMessage(null);

      try {
        const saved = await updateSettings(category, input);
        onSaved(saved);
        setSuccessMessage(savedMessage);
        return saved;
      } catch (caught) {
        setError(
          caught instanceof ApiError
            ? caught.message
            : "Something went wrong while saving these settings.",
        );
        return null;
      } finally {
        setIsSaving(false);
      }
    },
    [category, onSaved, savedMessage],
  );

  const restore = useCallback(async () => {
    setIsRestoring(true);
    setRestoreError(null);
    setSuccessMessage(null);

    try {
      const restored = await resetSettings(category);
      onSaved(restored);
      setSuccessMessage(restoredMessage);
      return restored;
    } catch (caught) {
      setRestoreError(
        caught instanceof ApiError
          ? caught.message
          : "Something went wrong while restoring the defaults.",
      );
      return null;
    } finally {
      setIsRestoring(false);
    }
  }, [category, onSaved, restoredMessage]);

  return {
    save,
    restore,
    isSaving,
    isRestoring,
    successMessage,
    error,
    restoreError,
    clearSuccess: () => setSuccessMessage(null),
    clearError: () => setError(null),
    clearRestoreError: () => setRestoreError(null),
  };
}
