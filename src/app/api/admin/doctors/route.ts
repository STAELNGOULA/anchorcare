import { NextResponse } from "next/server";
import {
  createDoctor,
  isPlatformAdmin,
  listDoctorsForAdmin,
} from "@/lib/doctors/doctor-service";
import { validateDoctorInput } from "@/lib/doctors/doctor-validation";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !(await isPlatformAdmin(user.id))) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("q") ?? undefined;
  const includeInactive = searchParams.get("includeInactive") === "1";

  const doctors = await listDoctorsForAdmin({ search, includeInactive });
  return NextResponse.json({ ok: true, doctors });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !(await isPlatformAdmin(user.id))) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = validateDoctorInput(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const data = parsed.data;
  const result = await createDoctor(user.id, {
    displayName: data.displayName as string,
    photoUrl: data.photoUrl as string | null,
    bio: data.bio as string | null,
    specialty: data.specialty as never,
    languages: data.languages as string[],
    country: data.country as "US" | "CA",
    region: data.region as string | null,
    bookingUrl: data.bookingUrl as string,
    isFeatured: data.isFeatured as boolean,
    sortOrder: data.sortOrder as number,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ ok: true, doctor: result.doctor });
}
