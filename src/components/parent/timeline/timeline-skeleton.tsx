export function TimelineSkeleton() {
  return (
    <div className="space-y-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="space-y-3">
          <div className="h-4 w-28 animate-pulse rounded bg-muted/60" />
          <div className="h-28 animate-pulse rounded-[1.25rem] bg-muted/40 ring-1 ring-border/30" />
        </div>
      ))}
    </div>
  );
}
