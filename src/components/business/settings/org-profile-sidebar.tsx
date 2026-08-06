"use client";

import { useTranslations } from "next-intl";
import { Copy, ExternalLink, Monitor, Smartphone } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type OrgProfileSidebarProps = {
  previewPath: string;
  publicPath: string;
  completion: number;
  previewDevice: "desktop" | "mobile";
  onPreviewDeviceChange: (device: "desktop" | "mobile") => void;
};

function toAbsoluteUrl(path: string): string {
  return new URL(path, window.location.origin).href;
}

export function OrgProfileSidebar({
  previewPath,
  publicPath,
  completion,
  previewDevice,
  onPreviewDeviceChange,
}: OrgProfileSidebarProps) {
  const t = useTranslations("business.settings.profileEditor");
  const [shareUrl, setShareUrl] = useState(publicPath);

  useEffect(() => {
    setShareUrl(toAbsoluteUrl(publicPath));
  }, [publicPath]);

  const copyLink = async () => {
    await navigator.clipboard.writeText(toAbsoluteUrl(publicPath));
    toast.success(t("linkCopied"));
  };

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(shareUrl)}`;

  return (
    <aside className="space-y-4 xl:sticky xl:top-8">
      <div className="rounded-[1.25rem] bg-card p-5 ring-1 ring-border/50">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-medium">{t("livePreview")}</p>
          <div className="flex gap-1">
            <button
              type="button"
              aria-label={t("desktopPreview")}
              onClick={() => onPreviewDeviceChange("desktop")}
              className={cn(
                "rounded-lg p-2",
                previewDevice === "desktop" ? "bg-secondary" : "text-muted-foreground",
              )}
            >
              <Monitor className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label={t("mobilePreview")}
              onClick={() => onPreviewDeviceChange("mobile")}
              className={cn(
                "rounded-lg p-2",
                previewDevice === "mobile" ? "bg-secondary" : "text-muted-foreground",
              )}
            >
              <Smartphone className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div
          className={cn(
            "mx-auto overflow-hidden rounded-xl border border-border/60 bg-muted/30 transition-[width] duration-[220ms] ease-out",
            previewDevice === "mobile" ? "w-[280px]" : "w-full",
          )}
        >
          <iframe
            title={t("livePreview")}
            src={previewPath}
            className="h-[420px] w-full border-0"
            loading="lazy"
          />
        </div>
      </div>

      <div className="rounded-[1.25rem] bg-card p-5 ring-1 ring-border/50">
        <p className="text-sm font-medium">{t("shareKit")}</p>
        <p className="mt-1 break-all text-xs text-muted-foreground" suppressHydrationWarning>
          {shareUrl}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button type="button" size="sm" variant="outline" className="rounded-full" onClick={() => void copyLink()}>
            <Copy className="mr-2 h-3.5 w-3.5" />
            {t("copyLink")}
          </Button>
          <Button type="button" size="sm" variant="outline" className="rounded-full" asChild>
            <a href={previewPath} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-2 h-3.5 w-3.5" />
              {t("openPreview")}
            </a>
          </Button>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={qrUrl} alt="" className="mx-auto mt-4 h-[120px] w-[120px] rounded-lg" />
      </div>

      <div className="rounded-[1.25rem] bg-card p-5 ring-1 ring-border/50">
        <p className="text-sm font-medium">{t("completion")}</p>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-[220ms] ease-out"
            style={{ width: `${completion}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">{t("completionValue", { value: completion })}</p>
      </div>
    </aside>
  );
}
