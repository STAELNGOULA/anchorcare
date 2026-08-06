"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Camera, ChevronDown, ChevronUp, Shield } from "lucide-react";
import { useTranslations } from "next-intl";
import type { SmsReportPayload } from "@/lib/reports/sms-report-types";
import { cn } from "@/lib/utils";

type SmsReportViewerProps = {
  payload: SmsReportPayload;
};

function formatReportDate(isoDate: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
    }).format(new Date(isoDate + "T12:00:00"));
  } catch {
    return isoDate;
  }
}

export function SmsReportViewer({ payload }: SmsReportViewerProps) {
  const t = useTranslations("public.smsReport");
  const [visible, setVisible] = useState(false);
  const [transcriptOpen, setTranscriptOpen] = useState(false);
  const accent = payload.branding.accentColor;

  useEffect(() => {
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) {
      setVisible(true);
      return;
    }
    const timer = window.setTimeout(() => setVisible(true), 40);
    return () => window.clearTimeout(timer);
  }, []);

  const signupHref = `/sign-up/parent?redirect=${encodeURIComponent(payload.deepLinkPath)}`;
  const loginHref = `/login?redirect=${encodeURIComponent(payload.deepLinkPath)}`;
  const openAppHref = payload.deepLinkPath;

  const ctaHref = payload.viewerIsParent
    ? openAppHref
    : payload.parentId
      ? loginHref
      : signupHref;

  const ctaLabel = payload.viewerIsParent
    ? t("cta.openApp")
    : payload.parentId
      ? t("cta.signIn")
      : t("cta.createAccount");

  return (
    <div
      className={cn(
        "min-h-[100dvh] bg-background pb-28 text-foreground transition-opacity duration-500 ease-out",
        visible ? "opacity-100" : "opacity-0",
      )}
    >
      <header
        className="border-b border-border/50 bg-card/80 px-4 py-5 backdrop-blur-md"
        style={{ borderBottomColor: `${accent}22` }}
      >
        <div className="mx-auto flex max-w-lg items-center gap-4">
          {payload.branding.logoUrl ? (
            <div className="relative size-12 shrink-0 overflow-hidden rounded-xl ring-1 ring-border/40">
              <Image
                src={payload.branding.logoUrl}
                alt=""
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          ) : (
            <div
              className="flex size-12 shrink-0 items-center justify-center rounded-xl text-sm font-semibold text-white"
              style={{ backgroundColor: accent }}
            >
              {payload.branding.orgName.charAt(0)}
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate font-display text-lg">{payload.branding.orgName}</p>
            <p className="truncate text-xs text-muted-foreground">
              {payload.programName}
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 py-8">
        <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
          {formatReportDate(payload.reportDate)}
        </p>
        <h1 className="mt-2 font-display text-3xl text-foreground">
          {t("headline", { name: payload.childFirstName })}
        </h1>

        <article className="mt-8 rounded-[1.25rem] bg-card p-6 ring-1 ring-border/50">
          <p className="text-[1.125rem] leading-relaxed text-foreground/95">
            {payload.reportText || t("noReportBody")}
          </p>
        </article>

        {payload.transcript ? (
          <div className="mt-6">
            <button
              type="button"
              onClick={() => setTranscriptOpen((v) => !v)}
              className="flex w-full items-center justify-between rounded-[1rem] bg-muted/40 px-4 py-3 text-left text-sm font-medium text-foreground transition-colors duration-200 hover:bg-muted/60"
            >
              {t("transcriptToggle")}
              {transcriptOpen ? (
                <ChevronUp className="size-4 shrink-0" />
              ) : (
                <ChevronDown className="size-4 shrink-0" />
              )}
            </button>
            {transcriptOpen ? (
              <p className="mt-3 rounded-[1rem] bg-card px-4 py-4 text-sm leading-relaxed text-muted-foreground ring-1 ring-border/40">
                {payload.transcript}
              </p>
            ) : null}
          </div>
        ) : null}

        {payload.photoCount > 0 ? (
          <div className="mt-8">
            <p className="mb-3 flex items-center gap-2 text-sm font-medium text-foreground">
              <Camera className="size-4" aria-hidden />
              {t("photosTitle", { count: payload.photoCount })}
            </p>
            <div className="grid grid-cols-3 gap-2">
              {Array.from({ length: Math.min(payload.photoCount, 6) }).map(
                (_, i) => (
                  <div
                    key={i}
                    className="aspect-square rounded-lg bg-muted/50 ring-1 ring-border/40"
                    aria-hidden
                  />
                ),
              )}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">{t("photosHint")}</p>
          </div>
        ) : null}
      </main>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border/60 bg-background/95 px-4 py-4 backdrop-blur-md">
        <div className="mx-auto flex max-w-lg flex-col gap-2">
          <Link
            href={ctaHref}
            className="flex min-h-12 items-center justify-center rounded-full bg-foreground text-center text-sm font-medium text-background transition-transform duration-200 ease-out active:scale-[0.98]"
          >
            {ctaLabel}
          </Link>
          {!payload.viewerIsParent && payload.parentId ? (
            <Link
              href={signupHref}
              className="text-center text-xs text-muted-foreground underline-offset-4 hover:underline"
            >
              {t("cta.createAccount")}
            </Link>
          ) : null}
        </div>
      </div>

      <footer className="mx-auto max-w-lg px-4 pb-8 pt-4">
        <p className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
          <Shield className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          {t("privacyFooter")}
        </p>
        <Link
          href="/privacy"
          className="mt-2 inline-block text-xs text-muted-foreground underline-offset-4 hover:underline"
        >
          {t("privacyLink")}
        </Link>
      </footer>
    </div>
  );
}
