import { NextResponse } from "next/server";
import {
  getIncidentBookingPrefill,
  listDoctorsForParent,
} from "@/lib/doctors/doctor-service";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const specialty = searchParams.get("specialty") ?? undefined;
  const search = searchParams.get("q") ?? undefined;
  const incidentId = searchParams.get("incidentId") ?? undefined;
  const childId = searchParams.get("childId") ?? undefined;

  const listing = await listDoctorsForParent(user.id, { specialty, search });

  let incidentPrefill = null;
  if (incidentId && childId) {
    incidentPrefill = await getIncidentBookingPrefill(
      user.id,
      incidentId,
      childId,
    );
  }

  return NextResponse.json({
    ok: true,
    ...listing,
    incidentPrefill,
  });
}
