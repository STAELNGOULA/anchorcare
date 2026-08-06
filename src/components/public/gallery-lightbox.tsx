"use client";

import Image from "next/image";
import { useState } from "react";
import type { GalleryImage } from "@/lib/business/org-profile-types";

export function GalleryLightbox({ images }: { images: GalleryImage[] }) {
  const [active, setActive] = useState<GalleryImage | null>(null);

  if (images.length === 0) return null;

  return (
    <>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {images
          .sort((a, b) => a.order - b.order)
          .map((image) => (
            <button
              key={image.url}
              type="button"
              className="relative aspect-[4/3] overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-black/5 transition-transform duration-200 ease-out hover:scale-[1.01] active:scale-[0.99] motion-reduce:transition-none"
              onClick={() => setActive(image)}
            >
              <Image
                src={image.url}
                alt={image.alt || ""}
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover"
              />
            </button>
          ))}
      </div>

      {active ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setActive(null)}
        >
          <div className="relative max-h-[90dvh] w-full max-w-4xl">
            <Image
              src={active.url}
              alt={active.alt || ""}
              width={1200}
              height={900}
              className="mx-auto max-h-[90dvh] w-auto rounded-lg object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
