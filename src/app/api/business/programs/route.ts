import { NextResponse } from "next/server";
import {
  createProgram,
  listProgramsForDirector,
} from "@/lib/business/program-service";
import { programCreateSchema } from "@/lib/business/program-validation";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const status = url.searchParams.get("status") as
    | "draft"
    | "active"
    | "archived"
    | "all"
    | null;
  const page = Number(url.searchParams.get("page") ?? "1");

  const result = await listProgramsForDirector(user.id, {
    status: status ?? "all",
    page: Number.isFinite(page) ? page : 1,
  });

  if (!result) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  return NextResponse.json({ ok: true, ...result });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalidBody" }, { status: 400 });
  }

  const parsed = programCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validationError", fieldErrors: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const result = await createProgram(user.id, parsed.data);
  if (!result.ok) {
    return NextResponse.json(
      { error: result.code, fieldErrors: result.fieldErrors },
      { status: result.code === "forbidden" ? 403 : 400 },
    );
  }

  return NextResponse.json({ ok: true, program: result.program }, { status: 201 });
}
