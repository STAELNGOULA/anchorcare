import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { PageHeader } from "@/components/business/page-header";
import { FamilyPlanBanner } from "@/components/parent/family-plan-banner";
import { ParentTimelineWorkspace } from "@/components/parent/timeline/parent-timeline-workspace";
import { TimelineSkeleton } from "@/components/parent/timeline/timeline-skeleton";
import { getParentContext } from "@/lib/parent/parent-context";
import { getParentTimelinePage } from "@/lib/parent/timeline-service";
import type { TimelineFilter } from "@/lib/parent/timeline-constants";

type PageProps = {
  searchParams: Promise<{ childId?: string; filter?: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("parent.timeline");
  return { title: t("metaTitle") };
}

function parseFilter(value?: string): TimelineFilter {
  if (
    value &&
    ["all", "reports", "photos", "incidents", "care"].includes(value)
  ) {
    return value as TimelineFilter;
  }
  return "all";
}

export default async function ParentTimelinePage({ searchParams }: PageProps) {
  const t = await getTranslations("parent.timeline");
  const context = await getParentContext();
  const { childId, filter: filterParam } = await searchParams;
  const filter = parseFilter(filterParam);

  const initialPage = await getParentTimelinePage(
    context.userId,
    context.plan,
    {
      childId: childId ?? null,
      filter,
    },
  );

  return (
    <div className="space-y-8 md:space-y-10">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />

      <FamilyPlanBanner context={context} />

      <Suspense fallback={<TimelineSkeleton />}>
        <ParentTimelineWorkspace
          initialPage={initialPage}
          initialChildId={childId}
          initialFilter={filter}
        />
      </Suspense>
    </div>
  );
}
