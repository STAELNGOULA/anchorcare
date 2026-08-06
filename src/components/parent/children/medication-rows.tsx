"use client";

import { useTranslations } from "next-intl";
import { Plus, Trash2 } from "lucide-react";
import { TextField } from "@/components/forms/text-field";
import { Button } from "@/components/ui/button";
import type { ChildMedication } from "@/lib/parent/child-types";
import { cn } from "@/lib/utils";

type MedicationRowsProps = {
  value: ChildMedication[];
  onChange: (value: ChildMedication[]) => void;
  errors?: Record<number, Partial<Record<keyof ChildMedication, string>>>;
};

const emptyRow = (): ChildMedication => ({
  name: "",
  dose: "",
  schedule: "",
});

export function MedicationRows({ value, onChange, errors }: MedicationRowsProps) {
  const t = useTranslations("parent.family.children.medications");

  const update = (index: number, patch: Partial<ChildMedication>) => {
    onChange(value.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  };

  const remove = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const add = () => {
    onChange([...value, emptyRow()]);
  };

  return (
    <div className="space-y-3">
      {value.map((row, index) => (
        <div
          key={index}
          className={cn(
            "grid gap-3 rounded-2xl border border-border/60 bg-secondary/30 p-4 md:grid-cols-[1fr_1fr_1fr_auto]",
            "animate-in fade-in slide-in-from-top-2 duration-300 ease-out",
          )}
        >
          <TextField
            id={`med-name-${index}`}
            label={t("name")}
            value={row.name}
            onChange={(e) => update(index, { name: e.target.value })}
            error={errors?.[index]?.name}
          />
          <TextField
            id={`med-dose-${index}`}
            label={t("dose")}
            value={row.dose}
            onChange={(e) => update(index, { dose: e.target.value })}
            error={errors?.[index]?.dose}
          />
          <TextField
            id={`med-schedule-${index}`}
            label={t("schedule")}
            value={row.schedule}
            onChange={(e) => update(index, { schedule: e.target.value })}
            error={errors?.[index]?.schedule}
          />
          <div className="flex items-end pb-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => remove(index)}
              aria-label={t("remove")}
            >
              <Trash2 className="h-4 w-4" aria-hidden />
            </Button>
          </div>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        className="rounded-full"
        onClick={add}
        disabled={value.length >= 20}
      >
        <Plus className="mr-2 h-4 w-4" aria-hidden />
        {t("add")}
      </Button>
    </div>
  );
}
