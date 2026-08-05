import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  children?: ReactNode;
  className?: string;
};

export function PageHeader({
  title,
  subtitle,
  children,
  className,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className="space-y-2">
        <h1 className="font-display text-3xl leading-tight tracking-tight text-foreground md:text-4xl">
          {title}
        </h1>
        {subtitle ? (
          <p className="max-w-2xl text-base leading-relaxed text-muted-foreground">
            {subtitle}
          </p>
        ) : null}
      </div>
      {children ? <div className="shrink-0">{children}</div> : null}
    </header>
  );
}
