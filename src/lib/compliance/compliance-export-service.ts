import { enqueueJob, processBackgroundJobs } from "@/lib/jobs/queue";
import { getDirectorOrgId } from "@/lib/business/org-profile-service";
import { createServiceClient } from "@/lib/supabase/service";

const EXPORT_TTL_SECONDS = 86400;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function exportsTable(client: { from: (t: string) => any }) {
  return client.from("compliance_exports" as "organizations");
}

export type ComplianceExportStatus = {
  exportId: string;
  status: string;
  downloadUrl: string | null;
  expiresAt: string | null;
  lastError: string | null;
};

export async function requestComplianceExport(
  userId: string,
  input: { startDate: string; endDate: string; format: "csv" | "zip" },
): Promise<ComplianceExportStatus | { error: string }> {
  const orgId = await getDirectorOrgId(userId);
  if (!orgId) return { error: "forbidden" };

  const start = new Date(input.startDate);
  const end = new Date(input.endDate);
  if (end < start) return { error: "invalid_range" };
  const maxRangeMs = 366 * 24 * 60 * 60 * 1000;
  if (end.getTime() - start.getTime() > maxRangeMs) return { error: "range_too_large" };

  const service = createServiceClient();
  const now = new Date().toISOString();
  const expiresAt = new Date(Date.now() + EXPORT_TTL_SECONDS * 1000).toISOString();

  const { data: row, error } = await exportsTable(service)
    .insert({
      org_id: orgId,
      requested_by: userId,
      start_date: input.startDate,
      end_date: input.endDate,
      format: input.format,
      status: "pending",
      expires_at: expiresAt,
      created_at: now,
      updated_at: now,
    })
    .select("id, status, expires_at")
    .single();

  if (error || !row) return { error: "create_failed" };

  await enqueueJob({
    type: "generate_compliance_export",
    payload: { exportId: row.id, orgId },
    idempotencyKey: `compliance-export-${row.id}`,
  });

  void processBackgroundJobs(2).catch(() => undefined);

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    await processComplianceExport(row.id);
  }

  return {
    exportId: row.id,
    status: row.status,
    downloadUrl: null,
    expiresAt: row.expires_at,
    lastError: null,
  };
}

export async function getComplianceExportStatus(
  userId: string,
  exportId: string,
): Promise<ComplianceExportStatus | { error: string }> {
  const orgId = await getDirectorOrgId(userId);
  if (!orgId) return { error: "forbidden" };

  const service = createServiceClient();
  const { data: row } = await exportsTable(service)
    .select("id, status, storage_path, expires_at, last_error, org_id")
    .eq("id", exportId)
    .maybeSingle();

  if (!row || row.org_id !== orgId) return { error: "not_found" };

  let downloadUrl: string | null = null;
  if (row.status === "ready" && row.storage_path) {
    const { data: signed } = await service.storage
      .from("compliance-exports")
      .createSignedUrl(row.storage_path, 3600);
    downloadUrl = signed?.signedUrl ?? null;
  }

  return {
    exportId: row.id,
    status: row.status,
    downloadUrl,
    expiresAt: row.expires_at,
    lastError: row.last_error,
  };
}

export async function processComplianceExport(exportId: string): Promise<void> {
  const service = createServiceClient();
  const { data: row } = await exportsTable(service)
    .select("*")
    .eq("id", exportId)
    .maybeSingle();

  if (!row || row.status === "ready") return;

  await exportsTable(service)
    .update({ status: "processing", updated_at: new Date().toISOString() })
    .eq("id", exportId);

  try {
    const { data: incidents } = await service
      .from("incidents")
      .select("id, occurred_at, severity, status, child_id, program_id")
      .eq("org_id", row.org_id)
      .gte("occurred_at", row.start_date)
      .lte("occurred_at", row.end_date);

    const { data: registrations } = await service
      .from("program_registrations")
      .select("id, status, payment_status, amount_paid_cents, created_at, program_id")
      .eq("org_id", row.org_id)
      .gte("created_at", row.start_date)
      .lte("created_at", `${row.end_date}T23:59:59Z`);

    const lines: string[] = [
      "type,id,date,status,amount_cents,program_id,child_id",
    ];

    for (const inc of incidents ?? []) {
      lines.push(
        `incident,${inc.id},${inc.occurred_at},${inc.severity},,${inc.program_id},${inc.child_id}`,
      );
    }

    for (const reg of registrations ?? []) {
      lines.push(
        `registration,${reg.id},${reg.created_at},${reg.status},${reg.amount_paid_cents ?? 0},${reg.program_id},`,
      );
    }

    const csv = lines.join("\n");
    const path = `${row.org_id}/${exportId}.csv`;

    const { error: uploadError } = await service.storage
      .from("compliance-exports")
      .upload(path, new Blob([csv], { type: "text/csv" }), { upsert: true });

    if (uploadError) throw uploadError;

    await exportsTable(service)
      .update({
        status: "ready",
        storage_path: path,
        updated_at: new Date().toISOString(),
      })
      .eq("id", exportId);
  } catch (err) {
    await exportsTable(service)
      .update({
        status: "failed",
        last_error: err instanceof Error ? err.message : "export_failed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", exportId);
  }
}
