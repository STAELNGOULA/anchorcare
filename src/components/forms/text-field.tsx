"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type TextFieldProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "id"
> & {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  containerClassName?: string;
};

export const TextField = React.forwardRef<HTMLInputElement, TextFieldProps>(
  (
    {
      id,
      label,
      hint,
      error,
      className,
      containerClassName,
      required,
      ...props
    },
    ref,
  ) => {
    const hintId = hint ? `${id}-hint` : undefined;
    const errorId = error ? `${id}-error` : undefined;
    const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

    return (
      <div className={cn("space-y-2", containerClassName)}>
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
          ref={ref}
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          required={required}
          className={cn(error && "border-destructive focus-visible:ring-destructive", className)}
          {...props}
        />
        {hint && !error ? (
          <p id={hintId} className="text-xs text-muted-foreground">
            {hint}
          </p>
        ) : null}
        {error ? (
          <p id={errorId} className="text-xs text-destructive" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    );
  },
);
TextField.displayName = "TextField";
