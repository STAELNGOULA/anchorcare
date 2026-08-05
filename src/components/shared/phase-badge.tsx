import { cn } from "@/lib/utils";
import type { BuildPhase } from "@/lib/navigation/phases";

const PHASE_STYLES: Record<BuildPhase, string> = {
  mvp: "bg-primary/12 text-primary",
  p15: "bg-accent/15 text-accent",
  p2: "bg-secondary text-muted-foreground",
  p3: "bg-muted text-muted-foreground",
};

type PhaseBadgeProps = {
  phase: BuildPhase;
  label: string;
  className?: string;
};

export function PhaseBadge({ phase, label, className }: PhaseBadgeProps) {
  return (
    <span
      className={cn(
        "shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium",
        PHASE_STYLES[phase],
        className,
      )}
    >
      {label}
    </span>
  );
}
