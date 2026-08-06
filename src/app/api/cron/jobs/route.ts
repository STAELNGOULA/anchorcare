import { NextResponse } from "next/server";
import { processBackgroundJobs } from "@/lib/jobs/queue";
import "@/lib/jobs/handlers";
import { childLogger } from "@/lib/logging/logger";
import { generateRequestId, REQUEST_ID_HEADER } from "@/lib/logging/request-id";

function authorizeCron(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV === "development";

  const auth = request.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  const requestId = request.headers.get(REQUEST_ID_HEADER) ?? generateRequestId();
  const log = childLogger({ requestId, path: "/api/cron/jobs" });

  if (!authorizeCron(request)) {
    log.warn("cron jobs unauthorized");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await processBackgroundJobs();
    log.info(result, "background jobs processed");
    return NextResponse.json({ ok: true, requestId, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Job processing failed";
    log.error({ message }, "background jobs error");
    return NextResponse.json({ error: message, requestId }, { status: 500 });
  }
}
