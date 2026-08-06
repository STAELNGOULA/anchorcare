import { unstable_cache } from "next/cache";
import { createServiceClient } from "@/lib/supabase/service";

export type DiscoveryCity = {
  city: string;
  region: string;
  orgCount: number;
};

export type DiscoveryOrg = {
  id: string;
  name: string;
  publicSlug: string;
  city: string;
  region: string;
  tagline: string | null;
  heroImageUrl: string | null;
  programCount: number;
};

function discoveryTable(client: ReturnType<typeof createServiceClient>) {
  return client.from("organizations");
}

async function fetchDiscoveryCities(): Promise<DiscoveryCity[]> {
  const service = createServiceClient();
  const { data } = await discoveryTable(service)
    .select("city, region")
    .eq("public_page_enabled", true);

  const map = new Map<string, DiscoveryCity>();
  for (const row of data ?? []) {
    const city = (row as { city: string; region: string }).city?.trim();
    const region = (row as { city: string; region: string }).region?.trim() ?? "";
    if (!city) continue;
    const key = `${city}|${region}`;
    const existing = map.get(key);
    if (existing) {
      existing.orgCount += 1;
    } else {
      map.set(key, { city, region, orgCount: 1 });
    }
  }

  return [...map.values()].sort((a, b) => b.orgCount - a.orgCount || a.city.localeCompare(b.city));
}

export const getDiscoveryCities = unstable_cache(
  fetchDiscoveryCities,
  ["discovery-cities"],
  { revalidate: 3600 },
);

export async function listDiscoveryOrgs(filters?: {
  city?: string;
  region?: string;
  query?: string;
}): Promise<DiscoveryOrg[]> {
  const service = createServiceClient();
  let query = discoveryTable(service)
    .select(
      "id, name, public_slug, city, region, public_tagline, cover_image_url, programs(count)",
    )
    .eq("public_page_enabled", true)
    .order("name");

  if (filters?.city) query = query.eq("city", filters.city);
  if (filters?.region) query = query.eq("region", filters.region);

  const { data } = await query.limit(50);
  const q = filters?.query?.trim().toLowerCase();

  return (data ?? [])
    .map((row) => {
      const programs = row.programs;
      const programCount = programs?.[0]?.count ?? 0;
      return {
        id: row.id,
        name: row.name,
        publicSlug: row.public_slug,
        city: row.city,
        region: row.region ?? "",
        tagline: row.public_tagline,
        heroImageUrl: row.cover_image_url,
        programCount,
      };
    })
    .filter((org) => {
      if (!q) return true;
      return (
        org.name.toLowerCase().includes(q) ||
        org.city.toLowerCase().includes(q) ||
        org.tagline?.toLowerCase().includes(q)
      );
    });
}
