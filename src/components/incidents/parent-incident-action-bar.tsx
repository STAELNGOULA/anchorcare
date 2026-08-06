"use client";

import Link from "next/link";
import { useState } from "react";
import {
  HeartPulse,
  MessageCircle,
  Phone,
  Share2,
  ShieldCheck,
  Stethoscope,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import type { ParentIncidentAction } from "@/lib/incidents/incident-detail-constants";
import type { IncidentDetail } from "@/lib/incidents/incident-types";
import { cn } from "@/lib/utils";

type ParentIncidentActionBarProps = {
  detail: IncidentDetail;
};

const ACTIONS: {
  id: ParentIncidentAction;
  icon: typeof HeartPulse;
  href?: (d: IncidentDetail) => string;
  external?: boolean;
  destructive?: boolean;
}[] = [
  {
    id: "book_doctor",
    icon: HeartPulse,
    href: (d) =>
      `/parent/care/doctors?childId=${d.childId}&incidentId=${d.id}`,
  },
  {
    id: "request_consult",
    icon: Stethoscope,
    href: (d) =>
      `/parent/care/consults?childId=${d.childId}&incidentId=${d.id}&programId=${d.programId}`,
  },
  {
    id: "talk_to_team",
    icon: MessageCircle,
    href: (d) =>
      `/parent/messages?program=${d.programId}&incidentId=${d.id}`,
  },
  {
    id: "share_clearance",
    icon: Share2,
    href: (d) =>
      `/parent/care/clearance?childId=${d.childId}&programId=${d.programId}&incidentId=${d.id}`,
  },
  {
    id: "handling",
    icon: ShieldCheck,
  },
  {
    id: "call_911",
    icon: Phone,
    href: () => "tel:911",
    external: true,
    destructive: true,
  },
];

export function ParentIncidentActionBar({ detail }: ParentIncidentActionBarProps) {
  const t = useTranslations("incidents.detail.parentActions");
  const [pending, setPending] = useState<string | null>(null);

  const recordAction = async (action: ParentIncidentAction) => {
    setPending(action);
    try {
      await fetch(`/api/parent/incidents/${detail.id}/actions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action }),
      });
      if (action === "handling") {
        toast.success(t("handlingRecorded"));
      }
    } finally {
      setPending(null);
    }
  };

  return (
    <div className="rounded-[1.25rem] bg-card p-5 ring-1 ring-border/50">
      <h2 className="font-display text-lg text-foreground">{t("title")}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {ACTIONS.map(({ id, icon: Icon, href, external, destructive }) => {
          const label = t(id);
          const className = cn(
            "flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition-[transform,background-color] duration-[220ms] ease-out active:scale-[0.98]",
            destructive
              ? "bg-destructive/10 text-destructive hover:bg-destructive/15"
              : "bg-secondary/60 text-foreground hover:bg-secondary",
          );

          if (href) {
            const target = href(detail);
            if (external) {
              return (
                <a key={id} href={target} className={className}>
                  <Icon className="size-4" aria-hidden />
                  {label}
                </a>
              );
            }
            return (
              <Link
                key={id}
                href={target}
                className={className}
                onClick={() => void recordAction(id)}
              >
                <Icon className="size-4" aria-hidden />
                {label}
              </Link>
            );
          }

          return (
            <button
              key={id}
              type="button"
              disabled={pending === id}
              onClick={() => void recordAction(id)}
              className={className}
            >
              <Icon className="size-4" aria-hidden />
              {pending === id ? t("saving") : label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
