"use client";

import { useTranslations } from "next-intl";
import { Plus, Trash2 } from "lucide-react";
import { TextField } from "@/components/forms/text-field";
import { Button } from "@/components/ui/button";
import type { EmergencyContact } from "@/lib/parent/child-types";

type EmergencyContactRowsProps = {
  value: EmergencyContact[];
  onChange: (value: EmergencyContact[]) => void;
};

const emptyContact = (): EmergencyContact => ({
  name: "",
  phone: "",
  relation: "",
});

export function EmergencyContactRows({ value, onChange }: EmergencyContactRowsProps) {
  const t = useTranslations("parent.family.children.emergencyContacts");

  const update = (index: number, patch: Partial<EmergencyContact>) => {
    onChange(value.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  };

  return (
    <div className="space-y-3">
      {value.map((row, index) => (
        <div
          key={index}
          className="grid gap-3 rounded-2xl border border-border/60 bg-secondary/30 p-4 md:grid-cols-3"
        >
          <TextField
            id={`ec-name-${index}`}
            label={t("name")}
            value={row.name}
            onChange={(e) => update(index, { name: e.target.value })}
          />
          <TextField
            id={`ec-phone-${index}`}
            label={t("phone")}
            type="tel"
            value={row.phone}
            onChange={(e) => update(index, { phone: e.target.value })}
          />
          <div className="flex items-end gap-2">
            <TextField
              id={`ec-relation-${index}`}
              label={t("relation")}
              value={row.relation}
              onChange={(e) => update(index, { relation: e.target.value })}
              className="flex-1"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onChange(value.filter((_, i) => i !== index))}
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
        onClick={() => onChange([...value, emptyContact()])}
        disabled={value.length >= 5}
      >
        <Plus className="mr-2 h-4 w-4" aria-hidden />
        {t("add")}
      </Button>
    </div>
  );
}
