import {
  marketingContainer,
  marketingSection,
  marketingSectionTone,
  type MarketingSectionTone,
} from "@/lib/marketing-layout";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type SectionShellProps = {
  id?: string;
  children: ReactNode;
  className?: string;
  containerClassName?: string;
  labelledBy?: string;
  tone?: MarketingSectionTone;
};

export function SectionShell({
  id,
  children,
  className,
  containerClassName,
  labelledBy,
  tone = "default",
}: SectionShellProps) {
  return (
    <section
      id={id}
      className={cn(marketingSection, marketingSectionTone[tone], className)}
      aria-labelledby={labelledBy}
    >
      <div className={cn(marketingContainer, containerClassName)}>
        {children}
      </div>
    </section>
  );
}
