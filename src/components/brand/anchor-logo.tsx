import { cn } from "@/lib/utils";

type AnchorLogoProps = {
  className?: string;
  showWordmark?: boolean;
};

export function AnchorLogo({ className, showWordmark = true }: AnchorLogoProps) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <span
        className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground"
        aria-hidden
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" role="img">
          <path d="M12 3c-1.5 2.2-4 4.2-4 7.5a4 4 0 1 0 8 0c0-3.3-2.5-5.3-4-7.5zm0 14.5c-3.5 0-6.5 1.8-8 4.5h16c-1.5-2.7-4.5-4.5-8-4.5z" />
        </svg>
      </span>
      {showWordmark ? (
        <span className="font-display text-lg tracking-tight text-foreground">
          ANCHOR
        </span>
      ) : null}
    </div>
  );
}
