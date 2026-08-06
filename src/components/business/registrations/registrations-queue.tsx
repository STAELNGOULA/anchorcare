"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { BezelCard } from "@/components/marketing/bezel-card";
import { HealthProfileDiff } from "@/components/business/registrations/health-profile-diff";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TextField } from "@/components/forms/text-field";
import type { RegistrationListItem } from "@/lib/registrations/types";
import { cn } from "@/lib/utils";

type RegistrationsQueueProps = {
  items: RegistrationListItem[];
  adoption: { invitesSent: number; activeRegistrations: number };
};

const STATUS_FILTER = ["all", "pending", "active", "withdrawn"] as const;

export function RegistrationsQueue({ items: initial, adoption }: RegistrationsQueueProps) {
  const t = useTranslations("business.families.registrations");
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [filter, setFilter] = useState<(typeof STATUS_FILTER)[number]>("all");
  const [rejectOpen, setRejectOpen] = useState(false);
  const [approveOpen, setApproveOpen] = useState(false);
  const [selected, setSelected] = useState<RegistrationListItem | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [pending, setPending] = useState(false);

  const filtered =
    filter === "all" ? items : items.filter((row) => row.status === filter);

  const patch = async (id: string, action: "approve" | "reject", reason?: string) => {
    setPending(true);
    try {
      const res = await fetch(`/api/business/registrations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action, reason }),
      });
      const data = (await res.json()) as { ok?: boolean };
      if (!res.ok || !data.ok) {
        toast.error(t("errors.actionFailed"));
        return;
      }
      toast.success(action === "approve" ? t("approved") : t("rejected"));
      setItems((prev) =>
        prev.map((row) =>
          row.id === id
            ? {
                ...row,
                status: action === "approve" ? "active" : "withdrawn",
              }
            : row,
        ),
      );
      router.refresh();
    } catch {
      toast.error(t("errors.actionFailed"));
    } finally {
      setPending(false);
      setRejectOpen(false);
      setApproveOpen(false);
      setSelected(null);
      setRejectReason("");
    }
  };

  return (
    <div className="space-y-6">
      <BezelCard className="flex flex-wrap items-center justify-between gap-4 p-5">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {t("adoptionLabel")}
          </p>
          <p className="mt-1 font-display text-2xl text-foreground">
            {t("adoptionCount", adoption)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTER.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={cn(
                "rounded-full px-3 py-1.5 text-sm font-medium transition-colors duration-300",
                filter === key
                  ? "bg-primary/12 text-foreground"
                  : "text-muted-foreground ring-1 ring-border/60 hover:text-foreground",
              )}
            >
              {t(`filters.${key}`)}
            </button>
          ))}
        </div>
      </BezelCard>

      {filtered.length === 0 ? (
        <BezelCard className="p-8 text-sm text-muted-foreground">{t("empty")}</BezelCard>
      ) : (
        <div className="space-y-2">
          {filtered.map((row) => (
            <BezelCard
              key={row.id}
              className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between"
            >
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-foreground">
                    {row.childFirstName} {row.childLastName}
                  </p>
                  {row.status === "pending" ? (
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-60 motion-reduce:animate-none" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
                    </span>
                  ) : null}
                </div>
                <p className="text-sm text-muted-foreground">
                  {row.programName} · {row.parentEmail ?? t("noEmail")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("source", { source: row.registrationSource })} ·{" "}
                  {new Date(row.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    "rounded-full px-2.5 py-1 text-xs font-medium capitalize",
                    row.status === "active" && "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
                    row.status === "pending" && "bg-amber-500/10 text-amber-800 dark:text-amber-200",
                    row.status === "withdrawn" && "bg-muted text-muted-foreground",
                  )}
                >
                  {t(`status.${row.status}`)}
                </span>
                <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-muted-foreground">
                  {t(`payment.${row.paymentStatus}`)}
                </span>
                {row.status === "pending" ? (
                  <>
                    <Button
                      type="button"
                      size="sm"
                      className="rounded-full"
                      onClick={() => {
                        setSelected(row);
                        setApproveOpen(true);
                      }}
                    >
                      {t("approve")}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="rounded-full"
                      onClick={() => {
                        setSelected(row);
                        setRejectOpen(true);
                      }}
                    >
                      {t("reject")}
                    </Button>
                  </>
                ) : null}
              </div>
            </BezelCard>
          ))}
        </div>
      )}

      <Dialog open={approveOpen} onOpenChange={setApproveOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display">{t("approveTitle")}</DialogTitle>
            <DialogDescription>{t("approveBody")}</DialogDescription>
          </DialogHeader>
          {selected?.healthSnapshot ? (
            <HealthProfileDiff snapshot={selected.healthSnapshot} />
          ) : null}
          <DialogFooter>
            <Button variant="outline" className="rounded-full" onClick={() => setApproveOpen(false)}>
              {t("cancel")}
            </Button>
            <Button
              className="rounded-full"
              disabled={pending || !selected}
              onClick={() => selected && void patch(selected.id, "approve")}
            >
              {pending ? t("processing") : t("confirmApprove")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">{t("rejectTitle")}</DialogTitle>
            <DialogDescription>{t("rejectBody")}</DialogDescription>
          </DialogHeader>
          <TextField
            id="rejectReason"
            label={t("rejectReason")}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" className="rounded-full" onClick={() => setRejectOpen(false)}>
              {t("cancel")}
            </Button>
            <Button
              variant="destructive"
              className="rounded-full"
              disabled={pending || !selected}
              onClick={() => selected && void patch(selected.id, "reject", rejectReason)}
            >
              {pending ? t("processing") : t("confirmReject")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
