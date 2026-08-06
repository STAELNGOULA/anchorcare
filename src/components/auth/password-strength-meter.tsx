"use client";

import { useTranslations } from "next-intl";
import {
  getPasswordScore,
  getPasswordStrengthLabel,
  getPasswordStrengthPercent,
  type PasswordStrengthLabel,
} from "@/lib/auth/password-strength";
import { cn } from "@/lib/utils";

type PasswordStrengthMeterProps = {
  password: string;
  className?: string;
};

const STRENGTH_LABEL_KEYS = {
  weak: "passwordStrengthWeak",
  fair: "passwordStrengthFair",
  good: "passwordStrengthGood",
  strong: "passwordStrengthStrong",
} as const;

const BAR_COLORS: Record<PasswordStrengthLabel, string> = {
  weak: "bg-destructive",
  fair: "bg-amber-500",
  good: "bg-primary",
  strong: "bg-emerald-500",
};

export function PasswordStrengthMeter({
  password,
  className,
}: PasswordStrengthMeterProps) {
  const t = useTranslations("auth");

  if (!password) return null;

  const score = getPasswordScore(password);
  const label = getPasswordStrengthLabel(score);
  const width = getPasswordStrengthPercent(score);

  const labelKey = STRENGTH_LABEL_KEYS[label];
  const labelText = t(labelKey);

  return (
    <div className={cn("space-y-2", className)} aria-live="polite">
      <div
        className="h-1.5 w-full overflow-hidden rounded-full bg-secondary"
        role="meter"
        aria-valuenow={width}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={labelText}
      >
        <div
          className={cn(
            "h-full rounded-full transition-[width] duration-[220ms] ease-out",
            BAR_COLORS[label],
          )}
          style={{ width: `${width}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground">{labelText}</p>
    </div>
  );
}
