import { NextResponse } from "next/server";
import {
  getDoctorForAdmin,
  isPlatformAdmin,
  listDoctorAudit,
  updateDoctor,
} from "@/lib/doctors/doctor-service";
import { validateDoctorInput } from "@/lib/doctors/doctor-validation";
import { createClient } from "@/lib/supabase/server";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !(await isPlatformAdmin(user.id))) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const doctor = await getDoctorForAdmin(id);
  if (!doctor) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const audit = await listDoctorAudit(id);
  return NextResponse.json({ ok: true, doctor, audit });
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !(await isPlatformAdmin(user.id))) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const existing = await getDoctorForAdmin(id);
  if (!existing) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const body = await request.json();

  if (
    body.isActive === false &&
    Object.keys(body).length === 1
  ) {
    const result = await updateDoctor(user.id, id, { isActive: false });
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
    return NextResponse.json({ ok: true, doctor: result.doctor });
  }

  if (
    body.isActive === true &&
    Object.keys(body).length === 1
  ) {
    const result = await updateDoctor(user.id, id, { isActive: true });
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
    return NextResponse.json({ ok: true, doctor: result.doctor });
  }

  const merged = {
    displayName: body.displayName ?? existing.displayName,
    photoUrl: body.photoUrl !== undefined ? body.photoUrl : existing.photoUrl,
    bio: body.bio !== undefined ? body.bio : existing.bio,
    specialty: body.specialty ?? existing.specialty,
    languages: body.languages ?? existing.languages,
    country: body.country ?? existing.country,
    region: body.region !== undefined ? body.region : existing.region,
    bookingUrl: body.bookingUrl ?? existing.bookingUrl,
    isFeatured: body.isFeatured ?? existing.isFeatured,
    sortOrder: body.sortOrder ?? existing.sortOrder,
  };

  const parsed = validateDoctorInput(merged);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const data = parsed.data;
  const result = await updateDoctor(user.id, id, {
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
    isActive:
      body.isActive === false ? false : body.isActive === true ? true : undefined,
  });

  if (!result.ok) {
    const status = result.error === "not_found" ? 404 : 500;
    return NextResponse.json({ error: result.error }, { status });
  }

  return NextResponse.json({ ok: true, doctor: result.doctor });
}
