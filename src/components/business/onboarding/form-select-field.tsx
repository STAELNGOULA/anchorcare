"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type FormSelectOption = {
  value: string;
  label: string;
};

type FormSelectFieldProps = {
  id: string;
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  options: FormSelectOption[];
  placeholder?: string;
  error?: string;
  required?: boolean;
  className?: string;
};

export function FormSelectField({
  id,
  label,
  value,
  onValueChange,
  options,
  placeholder,
  error,
  required,
  className,
}: FormSelectFieldProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <label htmlFor={id} className="text-sm font-medium leading-none">
        {label}
        {required ? (
          <span className="text-destructive" aria-hidden>
            {" "}
            *
          </span>
        ) : null}
      </label>
      <Select value={value} onValueChange={onValueChange} required={required}>
        <SelectTrigger id={id} aria-invalid={error ? true : undefined}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error ? (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
