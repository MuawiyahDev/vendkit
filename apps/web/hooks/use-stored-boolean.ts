import * as React from "react";

const listenersByKey = new Map<string, Set<() => void>>();

function subscribe(key: string) {
  return (onStoreChange: () => void): (() => void) => {
    let listeners = listenersByKey.get(key);
    if (!listeners) {
      listeners = new Set();
      listenersByKey.set(key, listeners);
    }
    listeners.add(onStoreChange);

    const onStorage = (event: StorageEvent) => {
      if (event.key === key || event.key === null) {
        onStoreChange();
      }
    };
    window.addEventListener("storage", onStorage);

    return () => {
      listeners?.delete(onStoreChange);
      window.removeEventListener("storage", onStorage);
    };
  };
}

function emit(key: string): void {
  listenersByKey.get(key)?.forEach((listener) => listener());
}

function readStoredValue(key: string, defaultValue: boolean): boolean {
  try {
    const raw = window.localStorage.getItem(key);
    return raw === null ? defaultValue : raw === "true";
  } catch {
    return defaultValue;
  }
}

/**
 * Boolean state persisted in localStorage.
 * Uses the snapshot API so the server and the first client render always agree.
 */
export function useStoredBoolean(
  key: string,
  defaultValue = false,
): [boolean, (value: boolean) => void] {
  const value = React.useSyncExternalStore(
    subscribe(key),
    () => readStoredValue(key, defaultValue),
    () => defaultValue,
  );

  const setValue = React.useCallback(
    (next: boolean) => {
      try {
        window.localStorage.setItem(key, String(next));
      } catch {
        // Storage may be unavailable (private mode, quota); keep the in-memory value.
      }
      emit(key);
    },
    [key],
  );

  return [value, setValue];
}
