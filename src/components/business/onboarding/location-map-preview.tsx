"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { ExternalLink, Loader2, MapPin } from "lucide-react";
import { getRegionsForCountry, type CountryCode } from "@/lib/geo/regions";
import { cn } from "@/lib/utils";

type LocationMapPreviewProps = {
  addressLine1: string;
  city: string;
  regionCode: string;
  postalCode: string;
  country: CountryCode;
  className?: string;
};

type Coords = { lat: number; lon: number };

function regionLabel(country: CountryCode, regionCode: string): string {
  if (!regionCode) return "";
  return (
    getRegionsForCountry(country).find((r) => r.code === regionCode)?.label ?? regionCode
  );
}

function embedUrl(coords: Coords): string {
  const { lat, lon } = coords;
  const pad = 0.012;
  const bbox = [lon - pad, lat - pad, lon + pad, lat + pad].join(",");
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lon}`;
}

function openStreetMapUrl(query: string): string {
  return `https://www.openstreetmap.org/search?query=${encodeURIComponent(query)}`;
}

export function LocationMapPreview({
  addressLine1,
  city,
  regionCode,
  postalCode,
  country,
  className,
}: LocationMapPreviewProps) {
  const t = useTranslations("business.onboarding");
  const [coords, setCoords] = useState<Coords | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");

  const query = useMemo(() => {
    const parts = [
      addressLine1.trim(),
      city.trim(),
      regionLabel(country, regionCode),
      postalCode.trim(),
      country === "CA" ? "Canada" : "United States",
    ].filter(Boolean);
    return parts.join(", ");
  }, [addressLine1, city, regionCode, postalCode, country]);

  const hasAddress =
    addressLine1.trim().length >= 3 &&
    city.trim().length >= 2 &&
    Boolean(regionCode);

  useEffect(() => {
    if (!hasAddress) {
      setCoords(null);
      setStatus("idle");
      return;
    }

    setStatus("loading");
    const controller = new AbortController();

    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          const res = await fetch(
            `/api/maps/geocode?q=${encodeURIComponent(query)}`,
            { signal: controller.signal },
          );

          if (!res.ok) {
            setCoords(null);
            setStatus("error");
            return;
          }

          const data = (await res.json()) as Coords;
          setCoords(data);
          setStatus("ready");
        } catch (err) {
          if (err instanceof DOMException && err.name === "AbortError") return;
          setCoords(null);
          setStatus("error");
        }
      })();
    }, 450);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [query, hasAddress]);

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-border/60 bg-secondary/30",
        className,
      )}
    >
      <div className="flex items-center gap-2 border-b border-border/50 px-4 py-2.5">
        <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
        <p className="text-sm font-medium text-foreground">{t("mapPreviewTitle")}</p>
      </div>

      {!hasAddress ? (
        <p className="px-4 py-6 text-sm text-muted-foreground">{t("mapPreviewEmpty")}</p>
      ) : (
        <div className="relative aspect-[16/9] w-full bg-muted/40 sm:aspect-[2/1]">
          {status === "loading" ? (
            <div className="absolute inset-0 z-10 flex items-center justify-center gap-2 bg-muted/40 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              {t("mapPreviewLoading")}
            </div>
          ) : null}

          {status === "ready" && coords ? (
            <iframe
              title={t("mapPreviewTitle")}
              className="absolute inset-0 h-full w-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              src={embedUrl(coords)}
            />
          ) : null}

          {status === "error" ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-4 text-center text-sm text-muted-foreground">
              <p>{t("mapPreviewError")}</p>
              <a
                href={openStreetMapUrl(query)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-primary underline-offset-4 hover:underline"
              >
                {t("mapPreviewOpenExternal")}
                <ExternalLink className="h-3.5 w-3.5" aria-hidden />
              </a>
            </div>
          ) : null}
        </div>
      )}

      {query ? (
        <p className="border-t border-border/50 px-4 py-2.5 text-xs text-muted-foreground">
          {query}
        </p>
      ) : null}
    </div>
  );
}
