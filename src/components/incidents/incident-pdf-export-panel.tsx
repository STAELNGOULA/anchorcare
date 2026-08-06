"use client";

import { useCallback, useEffect, useState } from "react";
import { FileDown, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type ExportState = {
  exportId: string;
  status: "pending" | "processing" | "ready" | "failed";
  downloadUrl: string | null;
  expiresAt: string | null;
  lastError: string | null;
};

type IncidentPdfExportPanelProps = {
  incidentId: string;
};

export function IncidentPdfExportPanel({ incidentId }: IncidentPdfExportPanelProps) {
  const t = useTranslations("incidents.detail.pdf");
  const [state, setState] = useState<ExportState | null>(null);
  const [polling, setPolling] = useState(false);

  const refresh = useCallback(async () => {
    const res = await fetch(`/api/business/incidents/${incidentId}/export-pdf`, {
      credentials: "include",
    });
    if (!res.ok) return;
    const data = (await res.json()) as ExportState;
    setState(data);
    return data;
  }, [incidentId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!polling) return;
    if (state?.status === "ready" || state?.status === "failed") {
      setPolling(false);
      if (state.status === "ready") {
        toast.success(t("ready"));
      } else if (state.status === "failed") {
        toast.error(t("failed"));
      }
      return;
    }

    const timer = window.setInterval(() => {
      void refresh();
    }, 2500);

    return () => window.clearInterval(timer);
  }, [polling, refresh, state?.status, t]);

  const requestExport = async () => {
    const res = await fetch(`/api/business/incidents/${incidentId}/export-pdf`, {
      method: "POST",
      credentials: "include",
    });
    const data = (await res.json()) as ExportState & { error?: string };

    if (!res.ok) {
      toast.error(t("requestFailed"));
      return;
    }

    setState(data);
    setPolling(true);
    toast.message(t("preparing"));
  };

  const isGenerating =
    polling || state?.status === "pending" || state?.status === "processing";

  return (
    <section
      className="rounded-[1.25rem] bg-card p-6 ring-1 ring-border/50 md:p-8"
      aria-live="polite"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-lg text-foreground">{t("title")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {state?.status === "ready" && state.downloadUrl ? (
            <Button asChild variant="default" className="min-h-11">
              <a href={state.downloadUrl} target="_blank" rel="noopener noreferrer">
                <FileDown className="mr-2 size-4" aria-hidden />
                {t("download")}
              </a>
            </Button>
          ) : null}
          <Button
            type="button"
            variant="outline"
            className="min-h-11"
            disabled={isGenerating}
            onClick={() => void requestExport()}
          >
            {isGenerating ? (
              <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
            ) : (
              <FileDown className="mr-2 size-4" aria-hidden />
            )}
            {isGenerating ? t("preparing") : t("export")}
          </Button>
        </div>
      </div>
      {state?.expiresAt ? (
        <p className="mt-3 text-xs text-muted-foreground">
          {t("expires", {
            date: new Date(state.expiresAt).toLocaleString(),
          })}
        </p>
      ) : null}
    </section>
  );
}
