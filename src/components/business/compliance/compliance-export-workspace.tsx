"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { BezelCard } from "@/components/marketing/bezel-card";
import { Button } from "@/components/ui/button";

export function ComplianceExportWorkspace() {
  const t = useTranslations("business.settings.compliance");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [format, setFormat] = useState<"csv" | "zip">("csv");
  const [pending, setPending] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const submit = async () => {
    if (!startDate || !endDate) return;
    setPending(true);
    setDownloadUrl(null);
    try {
      const res = await fetch("/api/business/compliance/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ startDate, endDate, format }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        exportId?: string;
        error?: string;
      };
      if (!res.ok || !data.ok || !data.exportId) {
        toast.error(t("errors.failed"));
        return;
      }
      toast.success(t("exportStarted"));
      for (let i = 0; i < 8; i++) {
        await new Promise((r) => setTimeout(r, 1500));
        const statusRes = await fetch(`/api/business/compliance/export/${data.exportId}`, {
          credentials: "include",
        });
        const statusData = (await statusRes.json()) as {
          downloadUrl?: string | null;
          status?: string;
        };
        if (statusData.downloadUrl) {
          setDownloadUrl(statusData.downloadUrl);
          toast.success(t("exportReady"));
          break;
        }
        if (statusData.status === "failed") {
          toast.error(t("errors.failed"));
          break;
        }
      }
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="font-display text-2xl text-foreground">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </header>

      <BezelCard className="space-y-4 p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2 text-sm">
            <span className="text-muted-foreground">{t("startDate")}</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-11 w-full rounded-lg border border-border bg-background px-3"
            />
          </label>
          <label className="space-y-2 text-sm">
            <span className="text-muted-foreground">{t("endDate")}</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="h-11 w-full rounded-lg border border-border bg-background px-3"
            />
          </label>
        </div>
        <div className="flex gap-2">
          {(["csv", "zip"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFormat(f)}
              className={
                format === f
                  ? "rounded-full border border-primary bg-primary/10 px-4 py-2 text-sm"
                  : "rounded-full border border-border px-4 py-2 text-sm text-muted-foreground"
              }
            >
              {t(`format.${f}`)}
            </button>
          ))}
        </div>
        <Button
          type="button"
          className="rounded-full"
          disabled={pending || !startDate || !endDate}
          onClick={() => void submit()}
        >
          {pending ? t("processing") : t("generate")}
        </Button>
        {downloadUrl ? (
          <a
            href={downloadUrl}
            className="text-sm font-medium text-primary underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            {t("download")}
          </a>
        ) : null}
      </BezelCard>
    </div>
  );
}
