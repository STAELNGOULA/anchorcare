import { NextResponse } from "next/server";
import {
  deleteMediaAsset,
  updateMediaCaption,
  updateMediaTags,
} from "@/lib/reports/media-service";
import { createClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{ programId: string; mediaId: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const { programId, mediaId } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    childIds?: string[];
    caption?: string | null;
  };

  if (body.childIds) {
    const result = await updateMediaTags(
      user.id,
      programId,
      mediaId,
      body.childIds,
    );
    if (!result.ok) {
      return NextResponse.json(
        { error: result.error, code: result.code },
        { status: 400 },
      );
    }
  }

  if (body.caption !== undefined) {
    const result = await updateMediaCaption(
      user.id,
      programId,
      mediaId,
      body.caption,
    );
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { programId, mediaId } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const result = await deleteMediaAsset(user.id, programId, mediaId);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
