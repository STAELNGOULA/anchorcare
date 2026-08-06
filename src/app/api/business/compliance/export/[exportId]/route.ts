import { NextResponse } from "next/server";
import { getComplianceExportStatus } from "@/lib/compliance/compliance-export-service";
import { createClient } from "@/lib/supabase/server";

type RouteContext = { params: Promise<{ exportId: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { exportId } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const result = await getComplianceExportStatus(user.id, exportId);
  if ("error" in result) {
    const status = result.error === "forbidden" ? 403 : 404;
    return NextResponse.json({ error: result.error }, { status });
  }

  return NextResponse.json({
    ok: true,
    status: result.status,
    downloadUrl: result.downloadUrl,
    expiresAt: result.expiresAt,
  });
}
