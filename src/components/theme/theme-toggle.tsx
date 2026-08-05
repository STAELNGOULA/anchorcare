"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type ThemeToggleProps = {
  className?: string;
  /** Marketing chrome uses pill-shaped controls */
  variant?: "default" | "pill";
};

export function ThemeToggle({ className, variant = "default" }: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const t = useTranslations("common");

  useEffect(() => setMounted(true), []);

  const shape =
    variant === "pill"
      ? "rounded-full"
      : "rounded-md";

  if (!mounted) {
    return (
      <span
        className={cn(
          "inline-flex h-9 w-9 shrink-0 items-center justify-center",
          shape,
          className,
        )}
        aria-hidden
      />
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "inline-flex h-9 w-9 shrink-0 items-center justify-center text-muted-foreground transition-colors duration-300 ease-premium hover:bg-secondary/80 hover:text-foreground",
        shape,
        className,
      )}
      aria-label={isDark ? t("themeLight") : t("themeDark")}
    >
      {isDark ? (
        <Sun className="h-4 w-4" aria-hidden />
      ) : (
        <Moon className="h-4 w-4" aria-hidden />
      )}
    </button>
  );
}
