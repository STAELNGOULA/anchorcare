import Link from "next/link";
import type { ReactNode } from "react";
import { BezelCard } from "@/components/marketing/bezel-card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  title: string;
  description?: string;
  icon?: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  actionHref?: string;
  className?: string;
  children?: ReactNode;
};

export function EmptyState({
  title,
  description,
  icon,
  actionLabel,
  onAction,
  actionHref,
  className,
  children,
}: EmptyStateProps) {
  return (
    <BezelCard
      className={cn(
        "flex flex-col items-start gap-5 p-8 md:p-10",
        className,
      )}
    >
      {icon ? (
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-primary">
          {icon}
        </div>
      ) : null}
      <div className="space-y-2">
        <h2 className="font-display text-2xl text-foreground">{title}</h2>
        {description ? (
          <p className="max-w-lg text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {children}
      {actionLabel && onAction ? (
        <Button type="button" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
      {actionLabel && actionHref ? (
        <Button asChild>
          <Link href={actionHref}>{actionLabel}</Link>
        </Button>
      ) : null}
    </BezelCard>
  );
}
