import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { childLogger } from "@/lib/logging/logger";
import { generateRequestId, REQUEST_ID_HEADER } from "@/lib/logging/request-id";

export async function GET(request: Request) {
  const requestId =
    request.headers.get(REQUEST_ID_HEADER) ?? generateRequestId();
  const log = childLogger({ requestId, path: "/api/health" });

  const body: Record<string, unknown> = {
    status: "ok",
    service: "anchor-care",
    timestamp: new Date().toISOString(),
    requestId,
  };

  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const supabase = createServiceClient();
      const { error } = await supabase.from("profiles").select("id").limit(1);
      body.database = error ? "degraded" : "connected";
      if (error) {
        log.warn({ message: error.message }, "health db check failed");
      }
    } catch (err) {
      body.database = "unavailable";
      log.warn({ err }, "health db unavailable");
    }
  } else {
    body.database = "not_configured";
  }

  const status = body.database === "degraded" ? 503 : 200;
  return NextResponse.json(body, {
    status,
    headers: { [REQUEST_ID_HEADER]: requestId },
  });
}
