"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type DatePickerProps = {
  id: string;
  label: string;
  value?: string;
  onChange: (value: string) => void;
  hint?: string;
  error?: string;
  required?: boolean;
  min?: string;
  max?: string;
  disabled?: boolean;
  className?: string;
};

export function DatePicker({
  id,
  label,
  value,
  onChange,
  hint,
  error,
  required,
  min,
  max,
  disabled,
  className,
}: DatePickerProps) {
  const errorId = error ? `${id}-error` : undefined;

  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={id}>
        {label}
        {required ? (
          <span className="text-destructive" aria-hidden>
            {" "}
            *
          </span>
        ) : null}
      </Label>
      <Input
        id={id}
        type="date"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        min={min}
        max={max}
        disabled={disabled}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={errorId}
        className={cn(error && "border-destructive")}
      />
      {hint && !error ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
      {error ? (
        <p id={errorId} className="text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
