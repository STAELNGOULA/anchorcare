"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { SkeletonList } from "@/components/shared/skeleton-list";
import type { ConsultListItem } from "@/lib/consults/consult-types";
import { cn } from "@/lib/utils";

type ChildOption = { id: string; firstName: string; lastName: string };

export function ParentConsultsClient() {
  const t = useTranslations("parent.care.consults");
  const router = useRouter();
  const searchParams = useSearchParams();

  const prefillChildId = searchParams.get("childId");
  const prefillIncidentId = searchParams.get("incidentId");
  const prefillProgramId = searchParams.get("programId");

  const [consults, setConsults] = useState<ConsultListItem[]>([]);
  const [children, setChildren] = useState<ChildOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showForm, setShowForm] = useState(Boolean(prefillChildId));
  const [childId, setChildId] = useState(prefillChildId ?? "");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [consultsRes, childrenRes] = await Promise.all([
        fetch("/api/parent/consults", { credentials: "include" }),
        fetch("/api/parent/children", { credentials: "include" }),
      ]);
      if (!consultsRes.ok) throw new Error("load_failed");
      const consultsData = await consultsRes.json();
      setConsults(consultsData.consults ?? []);
      if (childrenRes.ok) {
        const childrenData = await childrenRes.json();
        setChildren(
          (childrenData.children ?? []).map(
            (c: { id: string; firstName: string; lastName: string }) => ({
              id: c.id,
              firstName: c.firstName,
              lastName: c.lastName,
            }),
          ),
        );
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const submitRequest = async () => {
    if (!childId || !message.trim()) {
      toast.error(t("errors.required"));
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/parent/consults", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          childId,
          incidentId: prefillIncidentId,
          programId: prefillProgramId,
          initialMessage: message.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(t(`errors.${data.error as string}`) || t("errors.failed"));
        return;
      }
      router.push(`/parent/care/consults/${data.consultId}`);
    } catch {
      toast.error(t("errors.failed"));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <SkeletonList count={3} />;

  if (error) {
    return <ErrorState title={t("errorTitle")} onRetry={() => void load()} />;
  }

  return (
    <div className="space-y-6">
      {prefillIncidentId ? (
        <div className="rounded-[1.25rem] border border-primary/20 bg-primary/5 px-5 py-4 text-sm">
          <p className="font-medium text-foreground">{t("incidentBanner.title")}</p>
          <p className="mt-1 text-muted-foreground">{t("incidentBanner.body")}</p>
        </div>
      ) : null}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className={cn(
            "inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground",
            "transition-[transform,background-color] duration-[220ms] ease-out hover:bg-primary/92 active:scale-[0.98]",
          )}
        >
          <Plus className="size-4" aria-hidden />
          {t("requestCta")}
        </button>
      </div>

      {showForm ? (
        <div className="space-y-4 rounded-[1.25rem] bg-card p-6 ring-1 ring-border/50">
          <h2 className="font-display text-lg text-foreground">{t("form.title")}</h2>
          <div className="space-y-2">
            <label htmlFor="child" className="text-sm font-medium">
              {t("form.child")}
            </label>
            <select
              id="child"
              value={childId}
              onChange={(e) => setChildId(e.target.value)}
              className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm"
            >
              <option value="">{t("form.childPlaceholder")}</option>
              {children.map((child) => (
                <option key={child.id} value={child.id}>
                  {child.firstName} {child.lastName}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label htmlFor="message" className="text-sm font-medium">
              {t("form.message")}
            </label>
            <textarea
              id="message"
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t("form.messagePlaceholder")}
              className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
          <button
            type="button"
            disabled={submitting}
            onClick={() => void submitRequest()}
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground disabled:opacity-60"
          >
            {submitting ? t("form.submitting") : t("form.submit")}
          </button>
        </div>
      ) : null}

      {consults.length === 0 && !showForm ? (
        <EmptyState title={t("emptyTitle")} description={t("emptyBody")} />
      ) : (
        <div className="space-y-3">
          {consults.map((consult) => (
            <Link
              key={consult.id}
              href={`/parent/care/consults/${consult.id}`}
              className={cn(
                "block rounded-[1.25rem] bg-card p-5 ring-1 ring-border/50",
                "transition-[transform,box-shadow] duration-[220ms] ease-out hover:-translate-y-0.5 hover:shadow-sm active:scale-[0.99]",
              )}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-display text-lg text-foreground">
                    {consult.childFirstName}
                    {consult.programName ? ` · ${consult.programName}` : ""}
                  </p>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {consult.initialMessagePreview}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {consult.priority === "high" ? (
                    <span className="rounded-full bg-destructive/10 px-2.5 py-1 text-xs font-medium text-destructive">
                      {t("priority.high")}
                    </span>
                  ) : null}
                  <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium capitalize text-muted-foreground">
                    {t(`status.${consult.status}`)}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
