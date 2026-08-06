import type { AllergyItem, AllergySeverity } from "@/lib/parent/child-types";

export function parseAllergyItems(raw: unknown): AllergyItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item): item is { name: string; severity: string } => {
      return (
        typeof item === "object" &&
        item !== null &&
        typeof (item as { name?: string }).name === "string"
      );
    })
    .map((item) => ({
      name: item.name,
      severity:
        item.severity === "severe" || item.severity === "moderate"
          ? item.severity
          : "mild",
    }));
}

export function worstAllergySeverity(items: AllergyItem[]): AllergySeverity | null {
  if (items.length === 0) return null;
  if (items.some((i) => i.severity === "severe")) return "severe";
  if (items.some((i) => i.severity === "moderate")) return "moderate";
  return "mild";
}

export const SEVERITY_STRIP_CLASS: Record<AllergySeverity, string> = {
  severe: "bg-red-600",
  moderate: "bg-amber-500",
  mild: "bg-emerald-600",
};

export const SEVERITY_CHIP_CLASS: Record<AllergySeverity, string> = {
  severe: "bg-red-600/15 text-red-700 dark:text-red-300 border-red-600/30",
  moderate: "bg-amber-500/15 text-amber-800 dark:text-amber-200 border-amber-500/30",
  mild: "bg-emerald-600/15 text-emerald-800 dark:text-emerald-200 border-emerald-600/30",
};
