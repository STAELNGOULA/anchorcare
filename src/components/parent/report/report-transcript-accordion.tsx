"use client";

import { ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId, useState } from "react";
import { cn } from "@/lib/utils";

type ReportTranscriptAccordionProps = {
  transcript: string;
};

export function ReportTranscriptAccordion({
  transcript,
}: ReportTranscriptAccordionProps) {
  const t = useTranslations("parent.today.detail");
  const [open, setOpen] = useState(false);
  const panelId = useId();

  return (
    <div className="rounded-[1.25rem] bg-card ring-1 ring-border/50">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-5 py-4 text-left"
      >
        <span className="text-sm font-medium text-foreground">
          {t("transcriptToggle")}
        </span>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-transform duration-[220ms] ease-[cubic-bezier(0.32,0.72,0,1)]",
            open && "rotate-180",
          )}
          aria-hidden
        />
      </button>
      <div
        className={cn(
          "grid transition-[grid-template-rows] duration-[220ms] ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div id={panelId} className="overflow-hidden">
          <p className="border-t border-border/40 px-5 pb-5 pt-4 text-sm leading-relaxed text-muted-foreground">
            {transcript}
          </p>
        </div>
      </div>
    </div>
  );
}
