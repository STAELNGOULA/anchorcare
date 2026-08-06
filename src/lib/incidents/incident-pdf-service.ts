import {
  INCIDENT_PDF_BUCKET,
  INCIDENT_PDF_TTL_SECONDS,
} from "@/lib/incidents/incident-pdf-constants";
import { generateIncidentPdfBuffer } from "@/lib/incidents/incident-pdf-generator";
import {
  getIncidentDetail,
  getIncidentDetailForServiceExport,
} from "@/lib/incidents/incident-detail-service";
import { enqueueJob, processBackgroundJobs } from "@/lib/jobs/queue";
import { createServiceClient } from "@/lib/supabase/service";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function pdfExportsTable(client: { from: (table: string) => any }): any {
  return client.from("incident_pdf_exports" as "organizations");
}

export type IncidentPdfExportStatus = {
  exportId: string;
  status: "pending" | "processing" | "ready" | "failed";
  downloadUrl: string | null;
  expiresAt: string | null;
  lastError: string | null;
};

export async function requestIncidentPdfExport(
  userId: string,
  incidentId: string,
): Promise<IncidentPdfExportStatus | { error: string }> {
  const detail = await getIncidentDetail(userId, incidentId);
  if ("error" in detail) return { error: detail.error };
  if (detail.role !== "director") return { error: "forbidden" };

  const service = createServiceClient();
  const now = new Date().toISOString();
  const expiresAt = new Date(Date.now() + INCIDENT_PDF_TTL_SECONDS * 1000).toISOString();

  const { data: exportRow, error } = await pdfExportsTable(service)
    .insert({
      incident_id: incidentId,
      org_id: detail.orgId,
      requested_by: userId,
      status: "pending",
      expires_at: expiresAt,
      created_at: now,
      updated_at: now,
    })
    .select("id, status, expires_at")
    .single();

  if (error || !exportRow) return { error: "create_failed" };

  await enqueueJob({
    type: "generate_incident_pdf",
    payload: { exportId: exportRow.id, incidentId, requestedBy: userId },
    idempotencyKey: `incident-pdf-${exportRow.id}`,
  });

  void processBackgroundJobs(2).catch(() => undefined);

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    await processIncidentPdfExport(exportRow.id);
  }

  return {
    exportId: exportRow.id,
    status: "pending",
    downloadUrl: null,
    expiresAt: exportRow.expires_at,
    lastError: null,
  };
}

export async function getLatestIncidentPdfExport(
  userId: string,
  incidentId: string,
): Promise<IncidentPdfExportStatus | { error: string }> {
  const detail = await getIncidentDetail(userId, incidentId);
  if ("error" in detail) return { error: detail.error };
  if (detail.role !== "director") return { error: "forbidden" };

  const service = createServiceClient();
  const { data: row } = await pdfExportsTable(service)
    .select("id, status, storage_path, expires_at, last_error")
    .eq("incident_id", incidentId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!row) {
    return {
      exportId: "",
      status: "pending",
      downloadUrl: null,
      expiresAt: null,
      lastError: null,
    };
  }

  let downloadUrl: string | null = null;
  if (row.status === "ready" && row.storage_path) {
    const expires = row.expires_at ? new Date(row.expires_at) : null;
    if (!expires || expires.getTime() > Date.now()) {
      const { data: signed } = await service.storage
        .from(INCIDENT_PDF_BUCKET)
        .createSignedUrl(row.storage_path, INCIDENT_PDF_TTL_SECONDS);
      downloadUrl = signed?.signedUrl ?? null;
    }
  }

  return {
    exportId: row.id,
    status: row.status as IncidentPdfExportStatus["status"],
    downloadUrl,
    expiresAt: row.expires_at,
    lastError: row.last_error,
  };
}

export async function processIncidentPdfExport(exportId: string): Promise<void> {
  const service = createServiceClient();
  const now = new Date().toISOString();

  const { data: row } = await pdfExportsTable(service)
    .select("id, incident_id, requested_by, status")
    .eq("id", exportId)
    .maybeSingle();

  if (!row || row.status === "ready") return;

  await pdfExportsTable(service)
    .update({ status: "processing", updated_at: now })
    .eq("id", exportId);

  try {
    const detail = await getIncidentDetailForServiceExport(row.incident_id);
    if (!detail) throw new Error("not_found");

    const pdfBuffer = await generateIncidentPdfBuffer(detail);
    const storagePath = `${detail.orgId}/${row.incident_id}/${exportId}.pdf`;

    const { error: uploadError } = await service.storage
      .from(INCIDENT_PDF_BUCKET)
      .upload(storagePath, pdfBuffer, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadError) throw uploadError;

    const expiresAt = new Date(Date.now() + INCIDENT_PDF_TTL_SECONDS * 1000).toISOString();

    await pdfExportsTable(service)
      .update({
        status: "ready",
        storage_path: storagePath,
        expires_at: expiresAt,
        last_error: null,
        updated_at: now,
      })
      .eq("id", exportId);
  } catch (err) {
    const message = err instanceof Error ? err.message : "PDF generation failed";
    await pdfExportsTable(service)
      .update({
        status: "failed",
        last_error: message,
        updated_at: now,
      })
      .eq("id", exportId);
    throw err;
  }
}
