"use client";

import Link from "next/link";

import { NativeSelect } from "@/components/shared/native-select";
import { SETTINGS_CATEGORY_META } from "../constants/settings-categories";
import type { SettingsCategory } from "../settings.types";
import { cn } from "@/lib/utils";

interface SettingsCategoryNavProps {
  activeCategory: SettingsCategory;
  onNavigate: (href: string) => void;
}

/**
 * Desktop sidebar and mobile select for switching between settings
 * categories. Both use the same category metadata so labels and ordering
 * can never drift apart.
 */
export function SettingsCategoryNav({
  activeCategory,
  onNavigate,
}: SettingsCategoryNavProps) {
  return (
    <>
      <div className="lg:hidden">
        <label
          htmlFor="settings-category-mobile"
          className="text-muted-foreground mb-2 block text-xs font-medium"
        >
          Settings category
        </label>
        <NativeSelect
          id="settings-category-mobile"
          ariaLabel="Settings category"
          value={activeCategory}
          options={SETTINGS_CATEGORY_META.map((item) => ({
            value: item.value,
            label: item.title,
          }))}
          onChange={(event) => {
            const selected = SETTINGS_CATEGORY_META.find(
              (item) => item.value === event.target.value,
            );
            if (selected) {
              onNavigate(selected.href);
            }
          }}
        />
      </div>

      <nav
        aria-label="Settings categories"
        className="hidden lg:block"
      >
        <div className="sticky top-20 flex flex-col gap-1">
          <p className="text-muted-foreground mb-1 px-3 text-xs font-medium">
            Configuration
          </p>
          {SETTINGS_CATEGORY_META.map((item) => {
            const Icon = item.icon;
            const isActive = item.value === activeCategory;

            return (
              <Link
                key={item.value}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                onClick={(event) => {
                  event.preventDefault();
                  onNavigate(item.href);
                }}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-primary-soft text-primary-soft-foreground font-medium"
                    : "text-muted-foreground hover:bg-surface-hover hover:text-foreground",
                )}
              >
                <Icon className="size-4 shrink-0" aria-hidden="true" />
                <span className="truncate">{item.title}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
