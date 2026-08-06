"use client";

import { useTranslations } from "next-intl";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import type { ClearanceStatus } from "@/lib/roster/types";

type RosterFilterSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  programs: { id: string; name: string }[];
  programId: string;
  clearance: ClearanceStatus | "all";
  onApply: (filters: {
    programId: string;
    clearance: ClearanceStatus | "all";
  }) => void;
};

export function RosterFilterSheet({
  open,
  onOpenChange,
  programs,
  programId,
  clearance,
  onApply,
}: RosterFilterSheetProps) {
  const t = useTranslations("roster");

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[85dvh]">
        <SheetHeader>
          <SheetTitle>{t("filters")}</SheetTitle>
        </SheetHeader>
        <form
          className="mt-6 space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            onApply({
              programId: String(fd.get("programId") ?? ""),
              clearance: (fd.get("clearance") as ClearanceStatus | "all") ?? "all",
            });
            onOpenChange(false);
          }}
        >
          <div className="space-y-2">
            <label htmlFor="filter-program" className="text-sm font-medium">
              {t("filterProgram")}
            </label>
            <select
              id="filter-program"
              name="programId"
              defaultValue={programId}
              className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
            >
              <option value="">{t("allPrograms")}</option>
              {programs.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label htmlFor="filter-clearance" className="text-sm font-medium">
              {t("filterClearance")}
            </label>
            <select
              id="filter-clearance"
              name="clearance"
              defaultValue={clearance}
              className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
            >
              <option value="all">{t("allClearance")}</option>
              <option value="cleared">{t("clearance.cleared")}</option>
              <option value="pending">{t("clearance.pending")}</option>
              <option value="hold">{t("clearance.hold")}</option>
            </select>
          </div>
          <Button type="submit" className="w-full">
            {t("applyFilters")}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
