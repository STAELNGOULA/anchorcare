"use client";

import Image from "next/image";
import { useState } from "react";
import { useTranslations } from "next-intl";
import type { ReportDetailPhoto } from "@/lib/parent/report-detail-types";
import { cn } from "@/lib/utils";

type ReportPhotoGridProps = {
  photos: ReportDetailPhoto[];
  photoCount: number;
};

const BLUR_DATA_URL =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2UyZThlZiIvPjwvc3ZnPg==";

function PhotoTile({
  src,
  alt,
  index,
}: {
  src?: string;
  alt: string;
  index: number;
}) {
  const [loaded, setLoaded] = useState(!src);

  if (!src) {
    return (
      <div
        className="aspect-square animate-pulse rounded-xl bg-muted/60 ring-1 ring-border/40"
        aria-hidden
      />
    );
  }

  return (
    <div className="relative aspect-square overflow-hidden rounded-xl bg-muted ring-1 ring-border/40">
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(max-width: 768px) 33vw, 120px"
        className={cn(
          "object-cover transition-opacity duration-300 ease-out motion-reduce:transition-none",
          loaded ? "opacity-100" : "opacity-0",
        )}
        placeholder="blur"
        blurDataURL={BLUR_DATA_URL}
        onLoad={() => setLoaded(true)}
        unoptimized
      />
      {!loaded ? (
        <div
          className="absolute inset-0 animate-pulse bg-muted"
          aria-hidden
        />
      ) : null}
    </div>
  );
}

export function ReportPhotoGrid({ photos, photoCount }: ReportPhotoGridProps) {
  const t = useTranslations("parent.today.detail");

  if (photoCount <= 0 && photos.length === 0) return null;

  const tiles =
    photos.length > 0
      ? photos
      : Array.from({ length: Math.min(photoCount, 6) }).map((_, i) => ({
          id: `placeholder-${i}`,
          signedUrl: "",
          alt: "",
        }));

  return (
    <section aria-labelledby="report-photos-heading" className="space-y-3">
      <h2
        id="report-photos-heading"
        className="text-sm font-medium text-foreground"
      >
        {t("photosTitle", { count: photoCount || photos.length })}
      </h2>
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {tiles.map((photo, index) => (
          <PhotoTile
            key={photo.id}
            src={photo.signedUrl || undefined}
            alt={photo.alt}
            index={index}
          />
        ))}
      </div>
      {photos.length === 0 && photoCount > 0 ? (
        <p className="text-xs text-muted-foreground">{t("photosPending")}</p>
      ) : null}
    </section>
  );
}
