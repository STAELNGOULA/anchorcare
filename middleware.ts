import { updateSession } from "@/lib/supabase/session";
import { generateRequestId, REQUEST_ID_HEADER } from "@/lib/logging/request-id";
import { NextResponse, type NextRequest } from "next/server";

function checkCsrf(request: NextRequest): NextResponse | null {
  const method = request.method;
  const { pathname } = request.nextUrl;

  if (!["POST", "PUT", "DELETE", "PATCH"].includes(method)) return null;
  if (!pathname.startsWith("/api/")) return null;
  if (pathname.startsWith("/api/webhooks/")) return null;

  const origin = request.headers.get("origin");
  if (!origin) return null;

  try {
    const originHost = new URL(origin).host;
    const reqHost = request.headers.get("host") ?? "";
    if (originHost !== reqHost) {
      return NextResponse.json({ error: "CSRF check failed" }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ error: "CSRF check failed" }, { status: 403 });
  }

  return null;
}

export async function middleware(request: NextRequest) {
  const csrfError = checkCsrf(request);
  if (csrfError) return csrfError;

  const response = await updateSession(request);
  const requestId =
    request.headers.get(REQUEST_ID_HEADER) ?? generateRequestId();
  response.headers.set(REQUEST_ID_HEADER, requestId);
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
