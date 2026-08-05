import {
  marketingSectionHeader,
  type MarketingSectionTone,
} from "@/lib/marketing-layout";
import { cn } from "@/lib/utils";

type SectionHeadingProps = {
  id: string;
  title: string;
  subtitle?: string;
  className?: string;
};

export function SectionHeading({
  id,
  title,
  subtitle,
  className,
}: SectionHeadingProps) {
  return (
    <div className={cn(marketingSectionHeader, className)}>
      <h2
        id={id}
        className="font-display text-3xl leading-tight tracking-tight text-foreground md:text-4xl"
      >
        {title}
      </h2>
      {subtitle ? (
        <p className="text-lg leading-relaxed text-muted-foreground">
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}

export type { MarketingSectionTone };
