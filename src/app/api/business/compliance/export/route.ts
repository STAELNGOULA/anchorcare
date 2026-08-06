import { NextResponse } from "next/server";
import {
  requestComplianceExport,
  getComplianceExportStatus,
} from "@/lib/compliance/compliance-export-service";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const schema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  format: z.enum(["csv", "zip"]),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "validationError" }, { status: 400 });

  const result = await requestComplianceExport(user.id, parsed.data);
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 });

  return NextResponse.json({ ok: true, exportId: result.exportId, status: result.status });
}
