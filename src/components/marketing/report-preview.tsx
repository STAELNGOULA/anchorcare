import { BezelCard } from "@/components/marketing/bezel-card";
import { RevealOnView } from "@/components/marketing/reveal-on-view";

type ReportPreviewProps = {
  labels: {
    previewDate: string;
    previewChild: string;
    previewHeadline: string;
    previewBody: string;
    previewVoice: string;
    previewPhotos: string;
    previewPhotoAlt: string;
  };
};

function PhotoPlaceholder({ label }: { label: string }) {
  return (
    <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-gradient-to-br from-secondary via-secondary/70 to-primary/10">
      <div className="absolute inset-0 flex items-center justify-center">
        <svg
          viewBox="0 0 24 24"
          className="h-6 w-6 text-primary/35"
          fill="none"
          aria-hidden
        >
          <path
            d="M4 7.5A2.5 2.5 0 0 1 6.5 5h11A2.5 2.5 0 0 1 20 7.5v9A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5v-9Z"
            stroke="currentColor"
            strokeWidth="1.25"
          />
          <path
            d="M8.5 11.2 10.8 13.5 14.2 9.5 17.5 13"
            stroke="currentColor"
            strokeWidth="1.25"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <span className="sr-only">{label}</span>
    </div>
  );
}

export function ReportPreview({ labels }: ReportPreviewProps) {
  return (
    <RevealOnView delayMs={120} className="w-full">
      <BezelCard aria-label={labels.previewHeadline}>
        <div className="space-y-5 p-6 md:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">
                {labels.previewDate} · {labels.previewChild}
              </p>
              <p className="mt-1 font-display text-2xl leading-tight text-foreground md:text-3xl">
                {labels.previewHeadline}
              </p>
            </div>
            <span
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary"
              title="Private to family"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="none"
                aria-hidden
              >
                <path
                  d="M8 8.5V6.2a4 4 0 1 1 8 0V8.5M6 10h12v8a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-8Z"
                  stroke="currentColor"
                  strokeWidth="1.25"
                  strokeLinecap="round"
                />
              </svg>
              <span className="sr-only">Private to family</span>
            </span>
          </div>

          <p className="max-w-prose text-base leading-relaxed text-muted-foreground">
            {labels.previewBody}
          </p>

          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground">
              {labels.previewVoice}
            </span>
            <span className="rounded-full bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground">
              {labels.previewPhotos}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-1" aria-hidden>
            {[0, 1, 2].map((slot) => (
              <PhotoPlaceholder
                key={slot}
                label={`${labels.previewPhotoAlt} ${slot + 1}`}
              />
            ))}
          </div>
        </div>
      </BezelCard>
    </RevealOnView>
  );
}
