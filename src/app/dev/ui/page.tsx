import { notFound } from "next/navigation";
import { BezelCard } from "@/components/marketing/bezel-card";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { SkeletonList } from "@/components/shared/skeleton-list";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DevUiGallery } from "@/components/dev/dev-ui-gallery";

export const metadata = {
  title: "UI Gallery",
  robots: { index: false, follow: false },
};

export default function DevUiPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return (
    <div className="mx-auto max-w-4xl space-y-12 px-4 py-12">
      <PageHeader
        title="Foundation components"
        subtitle="Phase 0 shared primitives — development only."
      />

      <section className="space-y-4">
        <h2 className="font-display text-xl">States</h2>
        <SkeletonList count={3} />
        <EmptyState
          title="No reports yet"
          description="When coaches publish, daily updates appear here."
          actionLabel="Explore programs"
        />
        <ErrorState
          title="Could not load"
          description="Check your connection and try again."
        />
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-xl">Buttons</h2>
        <BezelCard className="flex flex-wrap gap-3 p-6">
          <Button>Primary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
        </BezelCard>
      </section>

      <DevUiGallery />
    </div>
  );
}
