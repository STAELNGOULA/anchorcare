import { NextResponse } from "next/server";
import {
  createParentFormRecord,
  deleteParentForm,
  listParentForms,
  updateParentFormMeta,
} from "@/lib/forms/form-service";
import type { ParentFormType } from "@/lib/forms/form-types";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const forms = await listParentForms(user.id);
  return NextResponse.json({ forms });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await request.formData();
  const file = form.get("file");
  const title = form.get("title");
  const formType = form.get("formType");
  const childId = form.get("childId");
  const programId = form.get("programId");
  const expiresAt = form.get("expiresAt");

  if (!(file instanceof File) || typeof title !== "string" || !title.trim()) {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const allowedTypes: ParentFormType[] = [
    "immunization",
    "physical",
    "permission",
    "custom",
  ];
  const type =
    typeof formType === "string" && allowedTypes.includes(formType as ParentFormType)
      ? (formType as ParentFormType)
      : "custom";

  const result = await createParentFormRecord(
    user.id,
    {
      title,
      formType: type,
      childId: typeof childId === "string" && childId ? childId : null,
      programId: typeof programId === "string" && programId ? programId : null,
      expiresAt:
        typeof expiresAt === "string" && expiresAt ? expiresAt : null,
    },
    file,
  );

  if (!result.ok) {
    const status = result.error === "childNotFound" ? 404 : 400;
    return NextResponse.json({ error: result.error }, { status });
  }

  return NextResponse.json({ ok: true, form: result.form });
}

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as {
    id?: string;
    title?: string;
    formType?: ParentFormType;
    childId?: string | null;
    programId?: string | null;
    expiresAt?: string | null;
  };

  if (!body.id) {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const result = await updateParentFormMeta(user.id, body.id, {
    title: body.title,
    formType: body.formType,
    childId: body.childId,
    programId: body.programId,
    expiresAt: body.expiresAt,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 404 });
  }

  return NextResponse.json({ ok: true, form: result.form });
}

export async function DELETE(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Bad request" }, { status: 400 });

  const result = await deleteParentForm(user.id, id);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
