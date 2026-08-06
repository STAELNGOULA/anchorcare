import { NextResponse } from "next/server";
import { logAuthEvent } from "@/lib/auth/audit";
import { createClient } from "@/lib/supabase/server";
import { generateRequestId, REQUEST_ID_HEADER } from "@/lib/logging/request-id";
import { z } from "zod";

const bodySchema = z.object({
  email: z.string().email().max(254),
});

export async function POST(request: Request) {
  const requestId =
    request.headers.get(REQUEST_ID_HEADER) ?? generateRequestId();

  try {
    const body = await request.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: true, message: "If an account exists, a verification email was sent." },
        { headers: { [REQUEST_ID_HEADER]: requestId } },
      );
    }

    const supabase = await createClient();
    const origin =
      request.headers.get("origin") ??
      process.env.NEXT_PUBLIC_APP_URL ??
      "http://localhost:3000";

    await supabase.auth.resend({
      type: "signup",
      email: parsed.data.email,
      options: {
        emailRedirectTo: `${origin}/auth/callback?next=/login`,
      },
    });

    await logAuthEvent({
      eventType: "login_fail",
      email: parsed.data.email,
      ip:
        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
        undefined,
      metadata: { action: "resend_verification" },
    });

    return NextResponse.json(
      { ok: true, message: "If an account exists, a verification email was sent." },
      { headers: { [REQUEST_ID_HEADER]: requestId } },
    );
  } catch {
    return NextResponse.json(
      { ok: true, message: "If an account exists, a verification email was sent." },
      { headers: { [REQUEST_ID_HEADER]: requestId } },
    );
  }
}
