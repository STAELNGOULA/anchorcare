"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

function formatPhoneDisplay(digits: string): string {
  const d = digits.replace(/\D/g, "").slice(0, 10);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

type PhoneInputProps = {
  id: string;
  label: string;
  value?: string;
  onChange: (e164: string, display: string) => void;
  country?: "US" | "CA";
  hint?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
};

export function PhoneInput({
  id,
  label,
  value = "",
  onChange,
  country = "US",
  hint,
  error,
  required,
  disabled,
  className,
}: PhoneInputProps) {
  const digits = value.replace(/\D/g, "").slice(-10);
  const display = formatPhoneDisplay(digits);
  const dialCode = country === "CA" ? "+1" : "+1";

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextDigits = e.target.value.replace(/\D/g, "").slice(0, 10);
    const nextDisplay = formatPhoneDisplay(nextDigits);
    const e164 = nextDigits.length === 10 ? `${dialCode}${nextDigits}` : "";
    onChange(e164, nextDisplay);
  };

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
        type="tel"
        inputMode="tel"
        autoComplete="tel-national"
        value={display}
        onChange={handleChange}
        placeholder="(555) 555-5555"
        disabled={disabled}
        required={required}
        aria-invalid={error ? true : undefined}
        className={cn(error && "border-destructive")}
      />
      {hint && !error ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
      {error ? (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
