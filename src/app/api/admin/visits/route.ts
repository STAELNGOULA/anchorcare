import { NextResponse } from "next/server";
import { isPlatformAdmin } from "@/lib/doctors/doctor-service";
import { createVisitReport } from "@/lib/visits/visit-service";
import { validateVisitReportInput } from "@/lib/visits/visit-validation";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !(await isPlatformAdmin(user.id))) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = validateVisitReportInput(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const data = parsed.data;
  const result = await createVisitReport(user.id, {
    childId: data.childId as string,
    doctorId: data.doctorId as string | null,
    doctorName: data.doctorName as string,
    appointmentDate: data.appointmentDate as string,
    summary: data.summary as string,
    pdfStoragePath: data.pdfStoragePath as string | null,
    forceDuplicate: body.forceDuplicate === true,
  });

  if (!result.ok) {
    const status =
      result.error === "duplicate_date"
        ? 409
        : result.error === "child_not_linked"
          ? 422
          : 400;
    return NextResponse.json(
      {
        error: result.error,
        duplicateDate: result.duplicateDate,
      },
      { status },
    );
  }

  return NextResponse.json({
    ok: true,
    visitId: result.visitId,
    duplicateWarning: result.duplicateWarning,
  });
}
