"use client";

import { Search, X } from "lucide-react";
import { useEffect, useRef } from "react";

import { Input } from "@/components/ui/input";

interface CustomersSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function CustomersSearchInput({
  value,
  onChange,
  disabled = false,
}: CustomersSearchInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // "/" jumps to search from anywhere on the page, unless the user is already
  // typing in a field or using a browser/OS shortcut.
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }

      const target = event.target;
      if (
        target instanceof HTMLElement &&
        target.closest(
          "input, textarea, select, [contenteditable='true'], [role='combobox'], [role='menu'], [role='listbox'], [role='dialog'], [role='alertdialog']",
        )
      ) {
        return;
      }

      event.preventDefault();
      inputRef.current?.focus();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="relative w-full sm:max-w-sm">
      <Search
        className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
        aria-hidden="true"
      />
      <Input
        ref={inputRef}
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        maxLength={100}
        placeholder="Search customers…"
        autoComplete="off"
        spellCheck={false}
        enterKeyHint="search"
        aria-label="Search customers"
        aria-keyshortcuts="/"
        className="pr-12 pl-9 [&::-webkit-search-cancel-button]:hidden"
      />
      {value.length > 0 ? (
        <button
          type="button"
          onClick={() => {
            onChange("");
            inputRef.current?.focus();
          }}
          disabled={disabled}
          aria-label="Clear search"
          className="text-muted-foreground hover:bg-surface-hover hover:text-foreground focus-visible:ring-ring/40 absolute top-1/2 right-1.5 flex size-7 -translate-y-1/2 items-center justify-center rounded-md transition-colors focus-visible:ring-[3px] focus-visible:outline-hidden disabled:pointer-events-none disabled:opacity-50"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      ) : (
        <kbd
          aria-hidden="true"
          className="border-border-subtle bg-surface-muted text-muted-foreground pointer-events-none absolute top-1/2 right-2.5 hidden h-5 min-w-5 -translate-y-1/2 items-center justify-center rounded border px-1.5 font-sans text-[0.625rem] font-medium sm:flex"
        >
          /
        </kbd>
      )}
    </div>
  );
}
