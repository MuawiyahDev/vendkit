"use client";

import { Check, ChevronsUpDown, Search } from "lucide-react";
import { useId, useMemo, useState } from "react";

import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export interface SearchableOption {
  value: string;
  label: string;
  description?: string;
}

interface SearchableSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  options: readonly SearchableOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  id?: string;
  ariaLabel?: string;
  className?: string;
}

/**
 * Accessible searchable picker for long option lists (currencies, countries,
 * timezones, languages). The trigger behaves like a select button and the
 * popover filters options as the user types.
 */
export function SearchableSelect({
  value,
  onValueChange,
  options,
  placeholder = "Select an option",
  searchPlaceholder = "Search…",
  emptyMessage = "No matching options.",
  disabled = false,
  id,
  ariaLabel,
  className,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const generatedId = useId();
  const triggerId = id ?? generatedId;
  const listboxId = `${triggerId}-listbox`;

  const selected =
    options.find((option) => option.value === value) ??
    (value ? { value, label: value } : undefined);

  const filteredOptions = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return options;
    }

    return options.filter((option) => {
      const haystack = `${option.label} ${option.value} ${option.description ?? ""}`;
      return haystack.toLowerCase().includes(normalized);
    });
  }, [options, query]);

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) {
      setQuery("");
    }
  }

  function handleSelect(nextValue: string) {
    onValueChange(nextValue);
    handleOpenChange(false);
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          id={triggerId}
          type="button"
          role="combobox"
          aria-label={ariaLabel}
          aria-expanded={open}
          aria-controls={listboxId}
          aria-haspopup="listbox"
          disabled={disabled}
          className={cn(
            "border-input bg-surface text-foreground hover:border-border-strong focus-visible:border-ring focus-visible:ring-ring/40 flex h-9 w-full items-center justify-between gap-2 rounded-md border px-3 text-left text-sm shadow-xs transition-[color,background-color,border-color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-60",
            !selected && "text-muted-foreground",
            className,
          )}
        >
          <span className="truncate">{selected?.label ?? placeholder}</span>
          <ChevronsUpDown
            className="text-muted-foreground size-4 shrink-0"
            aria-hidden="true"
          />
        </button>
      </PopoverTrigger>

      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] min-w-56 p-0"
        onOpenAutoFocus={(event) => {
          event.preventDefault();
        }}
      >
        <div className="border-border-subtle flex items-center gap-2 border-b px-3 py-2">
          <Search
            className="text-muted-foreground size-4 shrink-0"
            aria-hidden="true"
          />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
            className="h-8 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
            autoFocus
          />
        </div>

        <div
          id={listboxId}
          role="listbox"
          aria-label={ariaLabel}
          className="max-h-64 overflow-y-auto p-1.5"
        >
          {filteredOptions.length === 0 ? (
            <p className="text-muted-foreground px-2 py-6 text-center text-sm">
              {emptyMessage}
            </p>
          ) : (
            filteredOptions.map((option) => {
              const isSelected = option.value === value;

              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(option.value)}
                  className={cn(
                    "hover:bg-surface-hover focus-visible:bg-surface-hover flex w-full items-start gap-2 rounded-md px-2 py-2 text-left text-sm outline-none transition-colors",
                    isSelected && "bg-primary-soft/60",
                  )}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">
                      {option.label}
                    </span>
                    {option.description ? (
                      <span className="text-muted-foreground block truncate text-xs">
                        {option.description}
                      </span>
                    ) : null}
                  </span>
                  <Check
                    className={cn(
                      "text-primary mt-0.5 size-4 shrink-0",
                      !isSelected && "invisible",
                    )}
                    aria-hidden="true"
                  />
                </button>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
