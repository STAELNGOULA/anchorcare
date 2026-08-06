import { NextResponse } from "next/server";
import { logAuthEvent } from "@/lib/auth/audit";
import {
  parseLoginBody,
  performLogin,
} from "@/lib/auth/login-service";
import { childLogger } from "@/lib/logging/logger";
import { generateRequestId, REQUEST_ID_HEADER } from "@/lib/logging/request-id";
import { createClient } from "@/lib/supabase/server";

function clientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}

export async function POST(request: Request) {
  const requestId =
    request.headers.get(REQUEST_ID_HEADER) ?? generateRequestId();
  const log = childLogger({ requestId, path: "/api/auth/login" });

  try {
    const body = await request.json();
    const isAdmin =
      request.headers.get("x-anchor-admin-login") === "1" ||
      body.admin === true;

    const parsed = parseLoginBody(body);
    if (!parsed.ok) {
      return NextResponse.json(
        { error: "validationError", fieldErrors: parsed.fieldErrors, requestId },
        { status: 400, headers: { [REQUEST_ID_HEADER]: requestId } },
      );
    }

    const result = await performLogin(parsed.data, {
      ip: clientIp(request),
      userAgent: request.headers.get("user-agent") ?? undefined,
      requireAdminRole: isAdmin,
    });

    if (!result.ok) {
      const status =
        result.code === "rateLimited"
          ? 429
          : result.code === "validationError"
            ? 400
            : 401;

      return NextResponse.json(
        {
          error: result.code,
          fieldErrors: result.fieldErrors,
          retryAfterSeconds: result.retryAfterSeconds,
          requestId,
        },
        {
          status,
          headers: {
            [REQUEST_ID_HEADER]: requestId,
            ...(result.retryAfterSeconds
              ? { "Retry-After": String(result.retryAfterSeconds) }
              : {}),
          },
        },
      );
    }

    return NextResponse.json(
      { ok: true, redirect: result.redirect, requestId },
      { headers: { [REQUEST_ID_HEADER]: requestId } },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Login failed";
    log.error({ message }, "login route error");
    return NextResponse.json(
      { error: "unknownError", requestId },
      { status: 500, headers: { [REQUEST_ID_HEADER]: requestId } },
    );
  }
}
