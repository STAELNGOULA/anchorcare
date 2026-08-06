"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { ErrorState } from "@/components/shared/error-state";
import { SkeletonList } from "@/components/shared/skeleton-list";
import type {
  ModerationFlagItem,
  SlugDisputeItem,
} from "@/lib/admin/platform-types";
import { cn } from "@/lib/utils";

export function AdminModerationWorkspace() {
  const t = useTranslations("admin.moderation");
  const [flags, setFlags] = useState<ModerationFlagItem[]>([]);
  const [disputes, setDisputes] = useState<SlugDisputeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [grantedSlug, setGrantedSlug] = useState<Record<string, string>>({});
  const [pending, setPending] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch("/api/admin/moderation", { credentials: "include" });
      if (!res.ok) throw new Error("load_failed");
      const data = await res.json();
      setFlags(data.flags ?? []);
      setDisputes(data.slugDisputes ?? []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const resolveFlag = async (id: string, action: "dismiss" | "confirm") => {
    setPending(id);
    try {
      const res = await fetch(`/api/admin/moderation/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        toast.error(t("errors.flag_failed"));
        return;
      }
      toast.success(t(`toast.flag_${action}`));
      await load();
    } finally {
      setPending(null);
    }
  };

  const resolveDispute = async (
    id: string,
    action: "grant" | "reject" | "reassign",
  ) => {
    setPending(id);
    try {
      const res = await fetch(`/api/admin/slug-disputes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          action,
          grantedSlug: grantedSlug[id],
          resolutionNotes: notes[id],
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(t(`errors.${data.error as string}`) || t("errors.dispute_failed"));
        return;
      }
      toast.success(t("toast.dispute_resolved"));
      await load();
    } finally {
      setPending(null);
    }
  };

  if (loading) return <SkeletonList count={3} />;
  if (error) {
    return <ErrorState title={t("errorTitle")} onRetry={() => void load()} />;
  }

  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <h2 className="font-display text-xl text-foreground">{t("flagsTitle")}</h2>
        {flags.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("flagsEmpty")}</p>
        ) : (
          <div className="space-y-3">
            {flags.map((flag) => (
              <div
                key={flag.id}
                className="rounded-[1.25rem] bg-card p-5 ring-1 ring-border/50"
              >
                <p className="font-medium text-foreground">{flag.childName}</p>
                <p className="text-sm text-muted-foreground">
                  {flag.orgName}
                  {flag.programName ? ` · ${flag.programName}` : ""}
                </p>
                <p className="mt-2 text-sm">{flag.reason}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={pending === flag.id}
                    onClick={() => void resolveFlag(flag.id, "dismiss")}
                    className="min-h-10 rounded-full bg-secondary px-4 text-sm font-medium"
                  >
                    {t("dismiss")}
                  </button>
                  <button
                    type="button"
                    disabled={pending === flag.id}
                    onClick={() => void resolveFlag(flag.id, "confirm")}
                    className="min-h-10 rounded-full bg-destructive px-4 text-sm font-medium text-destructive-foreground"
                  >
                    {t("confirmRemove")}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-xl text-foreground">{t("slugTitle")}</h2>
        {disputes.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("slugEmpty")}</p>
        ) : (
          <div className="space-y-3">
            {disputes.map((dispute) => (
              <div
                key={dispute.id}
                className={cn(
                  "rounded-[1.25rem] bg-card p-5 ring-1 ring-border/50",
                )}
              >
                <p className="font-medium text-foreground">
                  {dispute.orgName} → /p/{dispute.disputedSlug}
                </p>
                {dispute.holderOrgName ? (
                  <p className="text-sm text-muted-foreground">
                    {t("heldBy", { name: dispute.holderOrgName })}
                  </p>
                ) : null}
                <p className="mt-2 text-sm">{dispute.reason}</p>
                <div className="mt-4 space-y-2">
                  <input
                    type="text"
                    value={grantedSlug[dispute.id] ?? dispute.disputedSlug}
                    onChange={(e) =>
                      setGrantedSlug((prev) => ({
                        ...prev,
                        [dispute.id]: e.target.value,
                      }))
                    }
                    placeholder={t("grantedSlug")}
                    className="h-10 w-full max-w-sm rounded-xl border border-input bg-background px-3 text-sm"
                  />
                  <textarea
                    rows={2}
                    value={notes[dispute.id] ?? ""}
                    onChange={(e) =>
                      setNotes((prev) => ({ ...prev, [dispute.id]: e.target.value }))
                    }
                    placeholder={t("resolutionNotes")}
                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={pending === dispute.id}
                    onClick={() => void resolveDispute(dispute.id, "grant")}
                    className="min-h-10 rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground"
                  >
                    {t("grantSlug")}
                  </button>
                  <button
                    type="button"
                    disabled={pending === dispute.id}
                    onClick={() => void resolveDispute(dispute.id, "reassign")}
                    className="min-h-10 rounded-full bg-secondary px-4 text-sm font-medium"
                  >
                    {t("reassignSlug")}
                  </button>
                  <button
                    type="button"
                    disabled={pending === dispute.id}
                    onClick={() => void resolveDispute(dispute.id, "reject")}
                    className="min-h-10 rounded-full px-4 text-sm text-muted-foreground underline-offset-4 hover:underline"
                  >
                    {t("reject")}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
