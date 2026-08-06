import { NextResponse } from "next/server";
import {
  archiveProgram,
  getProgramForDirector,
  updateProgram,
} from "@/lib/business/program-service";
import { programPatchSchema } from "@/lib/business/program-validation";
import { createClient } from "@/lib/supabase/server";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const program = await getProgramForDirector(user.id, id);
  if (!program) {
    return NextResponse.json({ error: "notFound" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, program });
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
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

  const parsed = programPatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validationError", fieldErrors: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const result = await updateProgram(user.id, id, parsed.data);
  if (!result.ok) {
    return NextResponse.json(
      { error: result.code, fieldErrors: result.fieldErrors },
      { status: result.code === "forbidden" ? 403 : 400 },
    );
  }

  return NextResponse.json({ ok: true, program: result.program });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const result = await archiveProgram(user.id, id);
  if (!result.ok) {
    return NextResponse.json(
      { error: result.code },
      { status: result.code === "forbidden" ? 403 : 400 },
    );
  }

  return NextResponse.json({ ok: true });
}
