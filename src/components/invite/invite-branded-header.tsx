"use client";

import { Building2 } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import type { InviteDetail } from "@/lib/invites/types";
import { cn } from "@/lib/utils";

type InviteBrandedHeaderProps = {
  invite: InviteDetail;
  className?: string;
};

function formatProgramDates(start: string | null): string | null {
  if (!start) return null;
  try {
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(start));
  } catch {
    return start;
  }
}

export function InviteBrandedHeader({ invite, className }: InviteBrandedHeaderProps) {
  const t = useTranslations("auth.inviteFlow");
  const orgLabel = invite.orgName ?? t("defaultOrg");
  const startLabel = formatProgramDates(invite.programStartDate);

  return (
    <div
      className={cn(
        "animate-in fade-in duration-500 fill-mode-both space-y-4 rounded-xl border border-border/50 bg-secondary/30 p-5",
        className,
      )}
    >
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-background ring-1 ring-border/60">
          {invite.orgLogoUrl ? (
            <Image
              src={invite.orgLogoUrl}
              alt=""
              width={48}
              height={48}
              className="h-full w-full object-cover"
            />
          ) : (
            <Building2 className="h-5 w-5 text-muted-foreground" aria-hidden />
          )}
        </div>
        <div className="min-w-0 space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {orgLabel}
          </p>
          <p className="font-display text-xl leading-tight text-foreground">
            {invite.programName}
          </p>
          {startLabel ? (
            <p className="text-sm text-muted-foreground">
              {t("programStarts", { date: startLabel })}
            </p>
          ) : null}
        </div>
      </div>

      {invite.childFirstName ? (
        <p className="text-sm text-muted-foreground">
          {t("childLine", { child: invite.childFirstName })}
        </p>
      ) : null}
    </div>
  );
}
