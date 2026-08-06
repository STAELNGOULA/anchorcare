"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { MapPin, Search } from "lucide-react";
import { BezelCard } from "@/components/marketing/bezel-card";
import { EmptyState } from "@/components/shared/empty-state";
import type { DiscoveryCity, DiscoveryOrg } from "@/lib/discovery/discovery-service";
import { cn } from "@/lib/utils";

type ProgramDiscoverWorkspaceProps = {
  cities: DiscoveryCity[];
  initialOrgs: DiscoveryOrg[];
};

export function ProgramDiscoverWorkspace({
  cities,
  initialOrgs,
}: ProgramDiscoverWorkspaceProps) {
  const t = useTranslations("parent.programs.discover");
  const [query, setQuery] = useState("");
  const [cityFilter, setCityFilter] = useState<string | null>(null);
  const [regionFilter, setRegionFilter] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return initialOrgs.filter((org) => {
      if (cityFilter && org.city !== cityFilter) return false;
      if (regionFilter && org.region !== regionFilter) return false;
      if (!q) return true;
      return (
        org.name.toLowerCase().includes(q) ||
        org.city.toLowerCase().includes(q) ||
        org.tagline?.toLowerCase().includes(q)
      );
    });
  }, [initialOrgs, query, cityFilter, regionFilter]);

  const selectCity = (city: DiscoveryCity) => {
    if (cityFilter === city.city && regionFilter === city.region) {
      setCityFilter(null);
      setRegionFilter(null);
    } else {
      setCityFilter(city.city);
      setRegionFilter(city.region);
    }
  };

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="font-display text-2xl text-foreground md:text-3xl">{t("title")}</h1>
        <p className="max-w-2xl text-sm text-muted-foreground md:text-base">{t("subtitle")}</p>
      </header>

      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <label htmlFor="discover-search" className="sr-only">{t("searchLabel")}</label>
        <input
          id="discover-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("searchPlaceholder")}
          className="h-11 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm"
        />
      </div>

      {cities.length > 0 ? (
        <section aria-labelledby="discover-cities-heading" className="space-y-3">
          <h2 id="discover-cities-heading" className="text-sm font-medium text-muted-foreground">
            {t("citiesTitle")}
          </h2>
          <div className="flex flex-wrap gap-2">
            {cities.slice(0, 12).map((city) => {
              const active = cityFilter === city.city && regionFilter === city.region;
              const label = city.region ? `${city.city}, ${city.region}` : city.city;
              return (
                <button
                  key={`${city.city}-${city.region}`}
                  type="button"
                  onClick={() => selectCity(city)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm transition-colors duration-200 ease-out",
                    active
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border bg-background text-muted-foreground hover:text-foreground",
                  )}
                >
                  <MapPin className="h-3.5 w-3.5" aria-hidden />
                  {label}
                  <span className="text-xs opacity-70">({city.orgCount})</span>
                </button>
              );
            })}
          </div>
        </section>
      ) : null}

      <section aria-labelledby="discover-orgs-heading" className="space-y-4">
        <h2 id="discover-orgs-heading" className="font-display text-xl text-foreground">
          {t("programsTitle")}
        </h2>

        {filtered.length === 0 ? (
          <EmptyState title={t("emptyTitle")} description={t("emptyBody")} />
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((org) => (
              <li key={org.id}>
                <Link href={`/p/${org.publicSlug}`} className="block group">
                  <BezelCard className="overflow-hidden transition-transform duration-200 ease-out group-hover:-translate-y-0.5">
                    {org.heroImageUrl ? (
                      <div
                        className="h-32 bg-cover bg-center"
                        style={{ backgroundImage: `url(${org.heroImageUrl})` }}
                        role="img"
                        aria-label={org.name}
                      />
                    ) : (
                      <div className="h-32 bg-secondary" />
                    )}
                    <div className="space-y-2 p-4">
                      <p className="font-display text-lg text-foreground">{org.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {org.city}{org.region ? `, ${org.region}` : ""}
                      </p>
                      {org.tagline ? (
                        <p className="text-sm text-muted-foreground line-clamp-2">{org.tagline}</p>
                      ) : null}
                      <p className="text-xs font-medium text-primary">
                        {t("programCount", { count: org.programCount })}
                      </p>
                    </div>
                  </BezelCard>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
