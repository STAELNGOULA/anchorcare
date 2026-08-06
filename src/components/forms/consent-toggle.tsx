"use client";

import { cn } from "@/lib/utils";

type ConsentToggleProps = {
  label: string;
  description?: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (value: boolean) => void;
};

export function ConsentToggle({
  label,
  description,
  checked,
  disabled = false,
  onChange,
}: ConsentToggleProps) {
  return (
    <div className="flex min-h-11 items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {description ? (
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        ) : null}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative mt-0.5 h-7 w-12 shrink-0 rounded-full transition-[background-color,transform] duration-[220ms] ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.97]",
          checked ? "bg-primary" : "bg-muted",
          disabled && "cursor-not-allowed opacity-50",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-background shadow-sm transition-transform duration-[220ms] ease-[cubic-bezier(0.32,0.72,0,1)]",
            checked && "translate-x-5",
          )}
        />
      </button>
    </div>
  );
}
