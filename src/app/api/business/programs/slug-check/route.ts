import { NextResponse } from "next/server";
import { getDirectorOrgId, isDirectorOfOrg } from "@/lib/business/org-profile-service";
import { createServiceClient } from "@/lib/supabase/service";
import { createClient } from "@/lib/supabase/server";
import { isValidPublicSlug } from "@/lib/business/slug";

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const orgId = await getDirectorOrgId(user.id);
  if (!orgId || !(await isDirectorOfOrg(user.id, orgId))) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const slug = new URL(request.url).searchParams.get("slug")?.trim() ?? "";
  if (!isValidPublicSlug(slug)) {
    return NextResponse.json({ available: false, reason: "invalid" });
  }

  const service = createServiceClient();
  const { data } = await service
    .from("programs")
    .select("id")
    .eq("org_id", orgId)
    .eq("program_slug", slug)
    .maybeSingle();

  return NextResponse.json({ available: !data });
}
