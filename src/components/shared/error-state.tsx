"use client";

import { AlertCircle } from "lucide-react";
import { BezelCard } from "@/components/marketing/bezel-card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ErrorStateProps = {
  title: string;
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
};

export function ErrorState({
  title,
  description,
  onRetry,
  retryLabel = "Try again",
  className,
}: ErrorStateProps) {
  return (
    <div role="alert">
      <BezelCard
        className={cn(
          "flex flex-col items-start gap-5 border-destructive/20 p-8 md:p-10",
          className,
        )}
      >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
        <AlertCircle className="h-6 w-6" aria-hidden />
      </div>
      <div className="space-y-2">
        <h2 className="font-display text-2xl text-foreground">{title}</h2>
        {description ? (
          <p className="max-w-lg text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {onRetry ? (
        <Button type="button" variant="outline" onClick={onRetry}>
          {retryLabel}
        </Button>
      ) : null}
      </BezelCard>
    </div>
  );
}
