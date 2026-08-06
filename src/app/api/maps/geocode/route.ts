import { NextResponse } from "next/server";

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim();

  if (!query || query.length < 5) {
    return NextResponse.json({ error: "invalid_query" }, { status: 400 });
  }

  const url = new URL(NOMINATIM_URL);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "1");
  url.searchParams.set("q", query);

  try {
    const res = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
        "User-Agent": "AnchorCare/1.0 (business-onboarding; contact@anchor.care)",
      },
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      return NextResponse.json({ error: "geocode_failed" }, { status: 502 });
    }

    const results = (await res.json()) as Array<{ lat: string; lon: string }>;
    const hit = results[0];

    if (!hit) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    return NextResponse.json({
      lat: Number(hit.lat),
      lon: Number(hit.lon),
    });
  } catch {
    return NextResponse.json({ error: "geocode_failed" }, { status: 502 });
  }
}
