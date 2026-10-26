"use client";

import { SearchInput } from "@/components/shared/search-input";

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
  return (
    <SearchInput
      value={value}
      onChange={onChange}
      disabled={disabled}
      placeholder="Search customers…"
      ariaLabel="Search customers"
    />
  );
}
