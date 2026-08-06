import { cn } from "@/lib/utils";

type SkeletonListProps = {
  count?: number;
  className?: string;
  itemClassName?: string;
};

export function SkeletonList({
  count = 5,
  className,
  itemClassName,
}: SkeletonListProps) {
  return (
    <ul className={cn("space-y-3", className)} aria-busy aria-label="Loading">
      {Array.from({ length: count }).map((_, i) => (
        <li
          key={i}
          className={cn(
            "skeleton-shimmer h-16 rounded-xl",
            itemClassName,
          )}
        />
      ))}
    </ul>
  );
}

export function SkeletonBlock({
  className,
}: {
  className?: string;
}) {
  return (
    <div
      className={cn("skeleton-shimmer rounded-xl", className)}
      aria-hidden
    />
  );
}
