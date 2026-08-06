import { createHash, randomBytes } from "crypto";
import {
  SMS_SUSPICIOUS_BURST_MS,
  SMS_SUSPICIOUS_VIEWS_THRESHOLD,
  SMS_TOKEN_MAX_VIEWS,
  SMS_TOKEN_TTL_MS,
} from "@/lib/reports/sms-token-constants";
import type { SmsReportResult } from "@/lib/reports/sms-report-types";
import {
  reportChildrenTable,
  reportsTable,
  serviceClient,
} from "@/lib/reports/table-utils";
import { getSiteUrl } from "@/lib/public/json-ld";
import { createClient } from "@/lib/supabase/server";

const SIGNED_LOGO_TTL = 3600;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function accessTokensTable(client: { from: (table: string) => any }): any {
  return client.from("report_access_tokens" as "program_registrations");
}

export function hashSmsToken(rawToken: string): string {
  return createHash("sha256").update(rawToken).digest("hex");
}

export function generateRawSmsToken(): string {
  return randomBytes(32).toString("base64url");
}

export function buildSmsReportUrl(rawToken: string): string {
  return `${getSiteUrl()}/r/${encodeURIComponent(rawToken)}`;
}

type TokenRow = {
  id: string;
  token_hash: string;
  report_child_id: string;
  daily_report_id: string;
  parent_id: string | null;
  child_id: string;
  expires_at: string;
  used_count: number;
  max_views: number;
  revoked_at: string | null;
  last_viewed_at: string | null;
  last_view_ip: string | null;
};

export async function createSmsTokensForReport(
  dailyReportId: string,
): Promise<{ tokensCreated: number; urls: string[] }> {
  const service = serviceClient();
  const childTable = reportChildrenTable(service);
  const tokenTable = accessTokensTable(service);

  const { data: report } = await reportsTable(service)
    .select("id, status, report_date, org_id, program_id")
    .eq("id", dailyReportId)
    .maybeSingle();

  if (!report || (report as { status: string }).status !== "published") {
    return { tokensCreated: 0, urls: [] };
  }

  const { data: rows } = await childTable
    .select("id, child_id, status")
    .eq("daily_report_id", dailyReportId)
    .eq("status", "published");

  const urls: string[] = [];
  let tokensCreated = 0;

  for (const row of (rows ?? []) as { id: string; child_id: string }[]) {
    const { data: existing } = await tokenTable
      .select("id")
      .eq("report_child_id", row.id)
      .is("revoked_at", null)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (existing) continue;

    const { data: child } = await service
      .from("children")
      .select("parent_id")
      .eq("id", row.child_id)
      .maybeSingle();

    const rawToken = generateRawSmsToken();
    const tokenHash = hashSmsToken(rawToken);
    const expiresAt = new Date(Date.now() + SMS_TOKEN_TTL_MS).toISOString();

    const { error } = await tokenTable.insert({
      token_hash: tokenHash,
      report_child_id: row.id,
      daily_report_id: dailyReportId,
      parent_id: child?.parent_id ?? null,
      child_id: row.child_id,
      expires_at: expiresAt,
      max_views: SMS_TOKEN_MAX_VIEWS,
    });

    if (!error) {
      tokensCreated += 1;
      urls.push(buildSmsReportUrl(rawToken));
    }
  }

  return { tokensCreated, urls };
}

async function signedLogoUrl(path: string | null): Promise<string | null> {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  try {
    const service = serviceClient();
    const { data } = await service.storage
      .from("org-logos")
      .createSignedUrl(path, SIGNED_LOGO_TTL);
    return data?.signedUrl ?? null;
  } catch {
    return null;
  }
}

export async function loadSmsReportByToken(
  rawToken: string,
  clientIp: string | null,
  viewerUserId: string | null,
): Promise<SmsReportResult> {
  const { checkSmsReportRateLimit } = await import(
    "@/lib/reports/sms-rate-limit"
  );
  const rate = await checkSmsReportRateLimit(clientIp ?? "unknown");
  if (!rate.allowed) {
    return { state: "rate_limited", retryAfterSeconds: rate.retryAfterSeconds };
  }

  const { recordSmsReportView } = await import("@/lib/reports/sms-rate-limit");
  await recordSmsReportView(clientIp ?? "unknown");

  if (!rawToken || rawToken.length < 16) {
    return { state: "invalid" };
  }

  const service = serviceClient();
  const tokenTable = accessTokensTable(service);
  const tokenHash = hashSmsToken(rawToken);

  const { data: tokenRow } = await tokenTable
    .select(
      "id, token_hash, report_child_id, daily_report_id, parent_id, child_id, expires_at, used_count, max_views, revoked_at, last_viewed_at, last_view_ip",
    )
    .eq("token_hash", tokenHash)
    .maybeSingle();

  if (!tokenRow) {
    return { state: "invalid" };
  }

  const token = tokenRow as TokenRow;

  if (token.revoked_at) {
    return { state: "revoked" };
  }

  if (new Date(token.expires_at).getTime() < Date.now()) {
    return { state: "expired" };
  }

  if (token.used_count >= token.max_views) {
    return { state: "max_views" };
  }

  const { data: report } = await reportsTable(service)
    .select("id, status, report_date, org_id, program_id, transcript")
    .eq("id", token.daily_report_id)
    .maybeSingle();

  if (!report || (report as { status: string }).status !== "published") {
    return { state: "not_published" };
  }

  const reportRow = report as {
    id: string;
    status: string;
    report_date: string;
    org_id: string;
    program_id: string;
    transcript: string | null;
  };

  const { data: reportChild } = await reportChildrenTable(service)
    .select(
      "id, published_text, transcript, photo_count, child_id",
    )
    .eq("id", token.report_child_id)
    .maybeSingle();

  if (!reportChild) {
    return { state: "invalid" };
  }

  const childRow = reportChild as {
    published_text: string | null;
    transcript: string | null;
    photo_count: number;
  };

  const now = new Date();
  const lastView = token.last_viewed_at
    ? new Date(token.last_viewed_at).getTime()
    : 0;
  const burst =
    lastView > 0 && now.getTime() - lastView < SMS_SUSPICIOUS_BURST_MS;

  const nextCount = token.used_count + 1;
  const suspicious =
    burst && nextCount >= SMS_SUSPICIOUS_VIEWS_THRESHOLD;

  await tokenTable
    .update({
      used_count: nextCount,
      last_viewed_at: now.toISOString(),
      last_view_ip: clientIp,
      revoked_at: suspicious ? now.toISOString() : null,
      updated_at: now.toISOString(),
    })
    .eq("id", token.id);

  if (suspicious) {
    return { state: "revoked" };
  }

  const [{ data: child }, { data: org }, { data: program }] = await Promise.all([
    service
      .from("children")
      .select("first_name")
      .eq("id", token.child_id)
      .maybeSingle(),
    service
      .from("organizations")
      .select("name, logo_url, brand_accent_color, public_headline")
      .eq("id", reportRow.org_id)
      .maybeSingle(),
    service
      .from("programs")
      .select("name")
      .eq("id", reportRow.program_id)
      .maybeSingle(),
  ]);

  const logoUrl = await signedLogoUrl(org?.logo_url ?? null);
  const deepLinkPath = `/parent/today/${token.child_id}/${reportRow.id}`;
  const viewerIsParent =
    Boolean(viewerUserId) && viewerUserId === token.parent_id;

  if (viewerIsParent && viewerUserId) {
    void import("@/lib/parent/today-service").then(({ recordParentEngagement }) =>
      recordParentEngagement(viewerUserId, "report_open", {
        childId: token.child_id,
        metadata: { source: "sms", dailyReportId: reportRow.id },
      }).catch(() => undefined),
    );
  }

  return {
    state: "valid",
    childFirstName: child?.first_name ?? "Your child",
    reportDate: reportRow.report_date,
    reportText: childRow.published_text ?? "",
    transcript: childRow.transcript ?? reportRow.transcript,
    photoCount: childRow.photo_count ?? 0,
    branding: {
      orgName: org?.public_headline ?? org?.name ?? "ANCHOR",
      logoUrl,
      accentColor: org?.brand_accent_color ?? "#4ECDC4",
    },
    programName: program?.name ?? "Program",
    parentId: token.parent_id,
    childId: token.child_id,
    dailyReportId: reportRow.id,
    deepLinkPath,
    viewerIsParent,
  };
}

export async function getViewerUserId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}
