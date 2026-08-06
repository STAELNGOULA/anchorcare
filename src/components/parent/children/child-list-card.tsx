"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Pencil, Trash2, UserRound } from "lucide-react";
import { BezelCard } from "@/components/marketing/bezel-card";
import { DeleteChildDialog } from "@/components/parent/children/delete-child-dialog";
import { HealthCompletenessBadge } from "@/components/parent/children/health-completeness-badge";
import { Button } from "@/components/ui/button";
import type { ChildListItem } from "@/lib/parent/child-types";
import { computeChildAge } from "@/lib/parent/child-utils";
import { cn } from "@/lib/utils";

type ChildListCardProps = {
  child: ChildListItem;
};

export function ChildListCard({ child }: ChildListCardProps) {
  const t = useTranslations("parent.family.children");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const age = computeChildAge(child.dateOfBirth);
  const fullName = `${child.firstName} ${child.lastName}`.trim();
  const profileHref = `/parent/family/children/${child.id}`;

  return (
    <>
      <BezelCard
        className={cn(
          "group flex h-full flex-col overflow-hidden",
          "transition-[box-shadow,background-color,transform] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
          "hover:bg-secondary/30 hover:shadow-soft",
          "motion-safe:hover:-translate-y-0.5 motion-safe:active:scale-[0.99]",
        )}
      >
        <Link href={profileHref} className="flex flex-1 flex-col outline-none">
          <div className="relative aspect-[4/3] w-full bg-secondary/50">
            {child.photoSignedUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={child.photoSignedUrl}
                alt=""
                className="h-full w-full object-cover transition-transform duration-500 ease-out motion-safe:group-hover:scale-[1.02]"
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-muted-foreground">
                <UserRound className="h-12 w-12" aria-hidden />
              </span>
            )}
            <div className="absolute right-3 top-3 rounded-full bg-card/90 p-1 shadow-soft backdrop-blur-sm">
              <HealthCompletenessBadge score={child.healthScore} showLabel={false} />
            </div>
          </div>
          <div className="flex flex-1 flex-col gap-2 p-5">
            <p className="font-display text-xl leading-tight text-foreground transition-colors duration-300 group-hover:text-primary">
              {fullName}
            </p>
            <p className="text-sm text-muted-foreground">
              {age ? t("age", { age }) : t("ageUnknown")}
            </p>
            {child.programCount > 0 ? (
              <p className="mt-auto text-xs font-medium uppercase tracking-wide text-primary/80">
                {t("programCount", { count: child.programCount })}
              </p>
            ) : (
              <p className="mt-auto text-xs text-muted-foreground">{t("noPrograms")}</p>
            )}
          </div>
        </Link>

        <div
          className="grid grid-cols-2 gap-2 border-t border-border/40 p-3"
          role="toolbar"
          aria-label={t("cardToolbarAria", { name: fullName })}
        >
          <Button
            variant="ghost"
            size="sm"
            className="h-10 rounded-full text-foreground"
            asChild
          >
            <Link href={profileHref} aria-label={t("cardEditAria", { name: fullName })}>
              <Pencil className="h-3.5 w-3.5 shrink-0" aria-hidden />
              <span className="truncate">{t("cardEdit")}</span>
            </Link>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-10 rounded-full text-destructive hover:bg-destructive/10 hover:text-destructive"
            aria-label={t("cardDeleteAria", { name: fullName })}
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="h-3.5 w-3.5 shrink-0" aria-hidden />
            <span className="truncate">{t("cardDelete")}</span>
          </Button>
        </div>
      </BezelCard>

      <DeleteChildDialog
        childId={child.id}
        childName={fullName}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
    </>
  );
}
