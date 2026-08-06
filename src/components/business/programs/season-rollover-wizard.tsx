"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { BezelCard } from "@/components/marketing/bezel-card";
import { TextField } from "@/components/forms/text-field";
import { Button } from "@/components/ui/button";

type SeasonRolloverWizardProps = {
  programId: string;
  programName: string;
};

export function SeasonRolloverWizard({ programId, programName }: SeasonRolloverWizardProps) {
  const t = useTranslations("business.programs.rollover");
  const router = useRouter();
  const [newSeasonName, setNewSeasonName] = useState("");
  const [pending, setPending] = useState(false);

  const submit = async () => {
    if (!newSeasonName.trim()) return;
    setPending(true);
    try {
      const res = await fetch(`/api/business/programs/${programId}/rollover`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ newSeasonName: newSeasonName.trim() }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        invitesSent?: number;
        newProgramId?: string;
        error?: string;
      };
      if (!res.ok || !data.ok) {
        toast.error(t("errors.failed"));
        return;
      }
      toast.success(t("success", { count: data.invitesSent ?? 0 }));
      router.push(`/business/programs/${data.newProgramId}`);
      router.refresh();
    } catch {
      toast.error(t("errors.failed"));
    } finally {
      setPending(false);
    }
  };

  return (
    <BezelCard className="space-y-4 p-6">
      <h2 className="font-display text-xl text-foreground">{t("title")}</h2>
      <p className="text-sm text-muted-foreground">
        {t("body", { program: programName })}
      </p>
      <TextField
        id="newSeasonName"
        label={t("newSeasonName")}
        value={newSeasonName}
        onChange={(e) => setNewSeasonName(e.target.value)}
        placeholder={t("newSeasonPlaceholder")}
      />
      <Button
        type="button"
        className="rounded-full"
        disabled={pending || !newSeasonName.trim()}
        onClick={() => void submit()}
      >
        {pending ? t("processing") : t("submit")}
      </Button>
    </BezelCard>
  );
}
