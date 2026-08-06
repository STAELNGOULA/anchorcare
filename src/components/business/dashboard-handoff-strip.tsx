import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ClipboardList } from "lucide-react";
import { BezelCard } from "@/components/marketing/bezel-card";
import type { HandoffNote } from "@/lib/handoff/handoff-types";

type DashboardHandoffStripProps = {
  notes: HandoffNote[];
};

export async function DashboardHandoffStrip({ notes }: DashboardHandoffStripProps) {
  const t = await getTranslations("business.dashboard.handoff");

  if (notes.length === 0) return null;

  const preview = notes.slice(0, 3);

  return (
    <section aria-labelledby="dashboard-handoff-heading" className="space-y-4">
      <div className="flex items-end justify-between gap-4">
        <h2
          id="dashboard-handoff-heading"
          className="font-display text-xl text-foreground md:text-2xl"
        >
          {t("title")}
        </h2>
        <Link
          href="/business/roster/handoff"
          className="text-sm text-muted-foreground transition-colors duration-200 hover:text-foreground"
        >
          {t("viewAll")}
        </Link>
      </div>

      <BezelCard className="divide-y divide-border/50 p-0">
        {preview.map((note) => (
          <div key={note.id} className="flex gap-3 px-5 py-4">
            <ClipboardList className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">
                {note.programName} · {note.authorName}
              </p>
              <p className="mt-1 line-clamp-2 text-sm text-foreground">{note.note}</p>
            </div>
          </div>
        ))}
      </BezelCard>
    </section>
  );
}
