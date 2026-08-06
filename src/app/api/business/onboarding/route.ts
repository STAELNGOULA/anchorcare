import { NextResponse } from "next/server";
import { businessOnboardingSchema } from "@/lib/business/onboarding-validation";
import { completeBusinessOnboarding } from "@/lib/business/onboarding-service";
import { childLogger } from "@/lib/logging/logger";
import { generateRequestId, REQUEST_ID_HEADER } from "@/lib/logging/request-id";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const requestId =
    request.headers.get(REQUEST_ID_HEADER) ?? generateRequestId();
  const log = childLogger({ requestId, path: "/api/business/onboarding" });

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "unauthorized", requestId },
        { status: 401, headers: { [REQUEST_ID_HEADER]: requestId } },
      );
    }

    const body = await request.json();
    const parsed = businessOnboardingSchema.safeParse(body);

    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0]?.toString();
        if (key && !fieldErrors[key]) {
          fieldErrors[key] = issue.message;
        }
      }
      return NextResponse.json(
        { error: "validationError", fieldErrors, requestId },
        { status: 400, headers: { [REQUEST_ID_HEADER]: requestId } },
      );
    }

    const result = await completeBusinessOnboarding(user.id, parsed.data);

    if (!result.ok) {
      const status =
        result.code === "orgExists" || result.code === "slugTaken"
          ? 409
          : result.code === "unauthorized"
            ? 401
            : 500;

      return NextResponse.json(
        {
          error: result.code,
          fieldErrors: result.fieldErrors,
          requestId,
        },
        { status, headers: { [REQUEST_ID_HEADER]: requestId } },
      );
    }

    return NextResponse.json(
      { ok: true, orgId: result.orgId, requestId },
      { headers: { [REQUEST_ID_HEADER]: requestId } },
    );
  } catch (err) {
    log.error({ err }, "business onboarding failed");
    return NextResponse.json(
      { error: "unknownError", requestId },
      { status: 500, headers: { [REQUEST_ID_HEADER]: requestId } },
    );
  }
}
