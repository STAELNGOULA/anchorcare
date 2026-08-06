"use client";

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import { Copy, Plus, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { BezelCard } from "@/components/marketing/bezel-card";
import { FormSelectField } from "@/components/business/onboarding/form-select-field";
import { TextField } from "@/components/forms/text-field";
import { Button } from "@/components/ui/button";
import type { BusinessInviteRow } from "@/lib/registrations/types";
import type { ProgramListItem } from "@/lib/business/program-types";
import { cn } from "@/lib/utils";

type InvitesWorkspaceProps = {
  programs: ProgramListItem[];
  initialInvites: BusinessInviteRow[];
  adoption: { invitesSent: number; activeRegistrations: number };
};

export function InvitesWorkspace({
  programs,
  initialInvites,
  adoption,
}: InvitesWorkspaceProps) {
  const t = useTranslations("business.settings.invites");
  const [invites, setInvites] = useState(initialInvites);
  const [programId, setProgramId] = useState(programs[0]?.id ?? "");
  const [email, setEmail] = useState("");
  const [childFirstName, setChildFirstName] = useState("");
  const [pending, setPending] = useState(false);

  const programOptions = programs.map((p) => ({ value: p.id, label: p.name }));

  const refresh = useCallback(async () => {
    const res = await fetch("/api/business/invites", { credentials: "include" });
    const data = (await res.json()) as { items?: BusinessInviteRow[] };
    if (data.items) setInvites(data.items);
  }, []);

  const createInvite = async () => {
    if (!programId) return;
    setPending(true);
    try {
      const res = await fetch("/api/invites/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          programId,
          email: email.trim() || undefined,
          childFirstName: childFirstName.trim() || undefined,
        }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        toast.error(t("errors.createFailed"));
        return;
      }
      toast.success(t("created"));
      setEmail("");
      setChildFirstName("");
      await refresh();
    } catch {
      toast.error(t("errors.createFailed"));
    } finally {
      setPending(false);
    }
  };

  const copyUrl = async (url: string | null) => {
    if (!url) return;
    await navigator.clipboard.writeText(url);
    toast.success(t("copied"));
  };

  const resend = async (inviteId: string) => {
    const res = await fetch("/api/business/invites/resend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ inviteId }),
    });
    const data = (await res.json()) as { ok?: boolean; inviteUrl?: string };
    if (!res.ok || !data.ok) {
      toast.error(t("errors.resendFailed"));
      return;
    }
    toast.success(t("resent"));
    await refresh();
  };

  return (
    <div className="space-y-8">
      <BezelCard className="flex flex-wrap items-center gap-6 p-6">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {t("adoptionLabel")}
          </p>
          <p className="mt-1 font-display text-2xl text-foreground">
            {t("adoptionCount", adoption)}
          </p>
        </div>
      </BezelCard>

      <BezelCard className="space-y-5 p-6">
        <h2 className="font-display text-xl text-foreground">{t("createTitle")}</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <FormSelectField
            id="inviteProgram"
            label={t("program")}
            value={programId}
            onValueChange={setProgramId}
            options={programOptions}
          />
          <TextField
            id="inviteEmail"
            label={t("email")}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            hint={t("emailHint")}
          />
          <TextField
            id="childFirstName"
            label={t("childFirstName")}
            value={childFirstName}
            onChange={(e) => setChildFirstName(e.target.value)}
          />
        </div>
        <Button
          type="button"
          className="rounded-full"
          disabled={!programId || pending}
          onClick={() => void createInvite()}
        >
          <Plus className="mr-2 h-4 w-4" aria-hidden />
          {pending ? t("creating") : t("createCta")}
        </Button>
      </BezelCard>

      <div className="space-y-3">
        <h2 className="font-display text-xl text-foreground">{t("tableTitle")}</h2>
        {invites.length === 0 ? (
          <BezelCard className="p-8 text-sm text-muted-foreground">{t("emptyTable")}</BezelCard>
        ) : (
          <div className="space-y-2">
            {invites.map((invite) => {
              const used = Boolean(invite.usedAt);
              const expired = new Date(invite.expiresAt).getTime() < Date.now();
              return (
                <BezelCard
                  key={invite.id}
                  className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 space-y-1">
                    <p className="font-medium text-foreground">
                      {invite.email ?? t("openInvite")}
                      {invite.childFirstName ? ` · ${invite.childFirstName}` : ""}
                    </p>
                    <p className="text-sm text-muted-foreground">{invite.programName}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-1 text-xs font-medium",
                        used
                          ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                          : expired
                            ? "bg-amber-500/10 text-amber-800 dark:text-amber-200"
                            : "bg-secondary text-muted-foreground",
                      )}
                    >
                      {used ? t("status.used") : expired ? t("status.expired") : t("status.pending")}
                    </span>
                    {!used && invite.inviteUrl ? (
                      <>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="rounded-full"
                          onClick={() => void copyUrl(invite.inviteUrl)}
                        >
                          <Copy className="mr-1 h-3.5 w-3.5" aria-hidden />
                          {t("copyLink")}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="rounded-full"
                          onClick={() => void resend(invite.id)}
                        >
                          <RefreshCw className="mr-1 h-3.5 w-3.5" aria-hidden />
                          {t("resend")}
                        </Button>
                      </>
                    ) : null}
                  </div>
                </BezelCard>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
