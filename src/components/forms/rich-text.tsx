"use client";

import * as React from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type RichTextProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  error?: string;
  maxLength?: number;
  rows?: number;
  placeholder?: string;
  className?: string;
};

/**
 * Markdown subset: **bold**, *italic*, line breaks. Full editor in later phases.
 */
export function RichText({
  id,
  label,
  value,
  onChange,
  hint,
  error,
  maxLength = 2000,
  rows = 5,
  placeholder,
  className,
}: RichTextProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={id}>{label}</Label>
      <textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, maxLength))}
        rows={rows}
        placeholder={placeholder}
        aria-invalid={error ? true : undefined}
        className={cn(
          "flex w-full rounded-xl border border-input bg-background px-4 py-3 text-sm",
          "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          error && "border-destructive",
        )}
      />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{hint ?? "Supports basic markdown"}</span>
        <span aria-live="polite">
          {value.length}/{maxLength}
        </span>
      </div>
      {error ? (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
