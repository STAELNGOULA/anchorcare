import { NextResponse } from "next/server";
import {
  formatIncidentBookingNotes,
  getDoctorForParent,
  getIncidentBookingPrefill,
  recordDoctorBookingClick,
} from "@/lib/doctors/doctor-service";
import { createClient } from "@/lib/supabase/server";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const doctor = await getDoctorForParent(id, user.id);
  if ("error" in doctor) {
    return NextResponse.json({ error: doctor.error }, { status: 404 });
  }

  return NextResponse.json({ ok: true, doctor });
}

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    childId?: string;
    incidentId?: string;
  };

  let notes: string | undefined;
  if (body.incidentId && body.childId) {
    const prefill = await getIncidentBookingPrefill(
      user.id,
      body.incidentId,
      body.childId,
    );
    if (prefill) {
      notes = formatIncidentBookingNotes(prefill);
    }
  }

  const result = await recordDoctorBookingClick(user.id, id, {
    childId: body.childId,
    incidentId: body.incidentId,
    notes,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 404 });
  }

  return NextResponse.json({ ok: true, bookingUrl: result.bookingUrl });
}
