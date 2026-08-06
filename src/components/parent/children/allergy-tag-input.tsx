"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Plus, X } from "lucide-react";
import { TextField } from "@/components/forms/text-field";
import { Button } from "@/components/ui/button";
import type { AllergyItem, AllergySeverity } from "@/lib/parent/child-types";
import { cn } from "@/lib/utils";

type AllergyTagInputProps = {
  items: AllergyItem[];
  onChange: (items: AllergyItem[]) => void;
  notes: string;
  onNotesChange: (value: string) => void;
};

const SEVERITIES: AllergySeverity[] = ["mild", "moderate", "severe"];

export function AllergyTagInput({
  items,
  onChange,
  notes,
  onNotesChange,
}: AllergyTagInputProps) {
  const t = useTranslations("parent.family.children.allergies");
  const [name, setName] = useState("");
  const [severity, setSeverity] = useState<AllergySeverity>("moderate");

  const add = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onChange([...items, { name: trimmed, severity }]);
    setName("");
  };

  const remove = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {items.map((item, index) => (
          <span
            key={`${item.name}-${index}`}
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium",
              item.severity === "severe" && "bg-accent/15 text-accent",
              item.severity === "moderate" && "bg-amber-500/15 text-amber-800",
              item.severity === "mild" && "bg-secondary text-foreground",
            )}
          >
            {item.name}
            <button
              type="button"
              onClick={() => remove(index)}
              className="rounded-full p-0.5 hover:bg-background/50"
              aria-label={t("remove", { name: item.name })}
            >
              <X className="h-3 w-3" aria-hidden />
            </button>
          </span>
        ))}
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <TextField
          id="allergy-name"
          label={t("name")}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="flex-1"
        />
        <div className="space-y-2">
          <label htmlFor="allergy-severity" className="text-sm font-medium">
            {t("severity")}
          </label>
          <select
            id="allergy-severity"
            value={severity}
            onChange={(e) => setSeverity(e.target.value as AllergySeverity)}
            className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm sm:w-36"
          >
            {SEVERITIES.map((s) => (
              <option key={s} value={s}>
                {t(`severityOptions.${s}`)}
              </option>
            ))}
          </select>
        </div>
        <Button type="button" variant="outline" className="rounded-full" onClick={add}>
          <Plus className="mr-2 h-4 w-4" aria-hidden />
          {t("add")}
        </Button>
      </div>
      <TextField
        id="allergy-notes"
        label={t("notes")}
        value={notes}
        onChange={(e) => onNotesChange(e.target.value)}
        hint={t("notesHint")}
      />
    </div>
  );
}
