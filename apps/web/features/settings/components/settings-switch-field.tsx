"use client";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface SettingsSwitchFieldProps {
  id: string;
  label: string;
  description?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

/**
 * Settings row with a switch and an explanatory description. The entire row
 * is a label so the text remains clickable and accessible.
 */
export function SettingsSwitchField({
  id,
  label,
  description,
  checked,
  onCheckedChange,
  disabled = false,
  className,
}: SettingsSwitchFieldProps) {
  return (
    <div
      className={
        className ??
        "border-border-subtle flex items-start justify-between gap-4 rounded-lg border px-4 py-3.5"
      }
    >
      <div className="flex min-w-0 flex-col gap-1">
        <Label htmlFor={id} className="cursor-pointer">
          {label}
        </Label>
        {description ? (
          <p
            id={`${id}-description`}
            className="text-muted-foreground text-xs leading-relaxed"
          >
            {description}
          </p>
        ) : null}
      </div>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        aria-describedby={description ? `${id}-description` : undefined}
        className="mt-0.5"
      />
    </div>
  );
}
