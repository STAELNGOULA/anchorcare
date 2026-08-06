import { childLogger } from "@/lib/logging/logger";
import { registerJobHandler } from "@/lib/jobs/processor";
import { ensureReportChildDrafts } from "@/lib/reports/review-report-service";
import {
  clearanceSharesTable,
  incidentAuditLogTable,
  incidentsTable,
  reportChildrenTable,
  reportsTable,
  serviceClient,
} from "@/lib/reports/table-utils";
import { createServiceClient } from "@/lib/supabase/service";

const log = childLogger({});

registerJobHandler("registration_paid_notify", async (job) => {
  const registrationId = job.payload.registrationId;
  if (typeof registrationId !== "string") return;

  log.info({ registrationId }, "registration paid notify (dev log)");
  // Email to director queued when Resend templates ship in Phase 14+
});

registerJobHandler("registration_receipt_email", async (job) => {
  const registrationId = job.payload.registrationId;
  if (typeof registrationId !== "string") return;

  const service = createServiceClient();
  const { data: reg } = await service
    .from("program_registrations")
    .select("parent_id, amount_paid_cents, programs(name)")
    .eq("id", registrationId)
    .maybeSingle();

  log.info(
    { registrationId, parentId: reg?.parent_id, amount: reg?.amount_paid_cents },
    "registration receipt email (dev log)",
  );
});

registerJobHandler("voice_transcribe", async (job) => {
  const reportId = job.payload.reportId;
  if (typeof reportId !== "string") return;

  const service = createServiceClient();
  const table = reportsTable(service);

  await table
    .update({
      status: "transcribing",
      updated_at: new Date().toISOString(),
    })
    .eq("id", reportId);

  const { data: report } = await table
    .select("id, program_id")
    .eq("id", reportId)
    .maybeSingle();

  if (!report) return;

  const { data: program } = await service
    .from("programs")
    .select("name")
    .eq("id", report.program_id)
    .maybeSingle();

  await ensureReportChildDrafts(
    reportId,
    report.program_id,
    program?.name ?? "Program",
  );

  log.info({ reportId }, "voice transcribe complete → per-child drafts");
});

registerJobHandler("notify_parents", async (job) => {
  const reportId = job.payload.reportId;
  if (typeof reportId !== "string") return;

  const service = serviceClient();
  const { data: rows } = await reportChildrenTable(service)
    .select("id, child_id, status")
    .eq("daily_report_id", reportId)
    .eq("status", "published");

  const childIds = (rows ?? []).map((row: { child_id: string }) => row.child_id);
  if (childIds.length === 0) {
    log.info({ reportId, count: 0 }, "notify_parents — no published children");
    return;
  }

  const { data: children } = await service
    .from("children")
    .select("id, parent_id")
    .in("id", childIds);

  const parentIds = [
    ...new Set(
      (children ?? []).map((c: { parent_id: string }) => c.parent_id).filter(Boolean),
    ),
  ];

  const { shouldDeliverRoutinePush, shouldDeliverRoutineSms } = await import(
    "@/lib/notifications/delivery-policy"
  );

  for (const parentId of parentIds) {
    const pushOk = await shouldDeliverRoutinePush(parentId);
    const smsOk = await shouldDeliverRoutineSms(parentId);
    log.info(
      {
        reportId,
        parentId,
        pushOk,
        smsOk,
        deferredQuietHours: !pushOk && !smsOk,
      },
      pushOk || smsOk
        ? "notify_parents staged (routine)"
        : "notify_parents deferred (quiet hours / prefs)",
    );
  }
});

registerJobHandler("incident_notify_parent", async (job) => {
  const incidentId = job.payload.incidentId;
  if (typeof incidentId !== "string") return;

  const service = createServiceClient();
  const now = new Date().toISOString();
  const priority = job.payload.priority === "high" ? "priority" : "standard";

  const { data: incident } = await incidentsTable(service)
    .select("id, child_id, is_red_flag, parent_notified_at, programs(name)")
    .eq("id", incidentId)
    .maybeSingle();

  if (!incident || incident.parent_notified_at) return;

  const { data: child } = await service
    .from("children")
    .select("parent_id, first_name")
    .eq("id", incident.child_id)
    .maybeSingle();

  log.info(
    {
      incidentId,
      parentId: child?.parent_id,
      childName: child?.first_name,
      priority,
      isRedFlag: incident.is_red_flag,
      programName: (incident.programs as { name: string } | null)?.name,
    },
    priority === "priority"
      ? "incident RED parent SMS/push (priority queue — dev log)"
      : "incident parent notify (dev log)",
  );

  await incidentsTable(service)
    .update({
      parent_notified_at: now,
      updated_at: now,
    })
    .eq("id", incidentId)
    .is("parent_notified_at", null);

  await incidentAuditLogTable(service).insert({
    incident_id: incidentId,
    actor_id: null,
    action: "parent_notified",
    metadata: { channel: "sms_push_staged", priority },
  });
});

registerJobHandler("incident_amend_notify_parent", async (job) => {
  const incidentId = job.payload.incidentId;
  if (typeof incidentId !== "string") return;

  const service = createServiceClient();
  const priority = job.payload.priority === "high" ? "priority" : "standard";

  const { data: incident } = await incidentsTable(service)
    .select("id, child_id, is_red_flag")
    .eq("id", incidentId)
    .maybeSingle();

  if (!incident) return;

  const { data: child } = await service
    .from("children")
    .select("parent_id, first_name")
    .eq("id", incident.child_id)
    .maybeSingle();

  log.info(
    {
      incidentId,
      parentId: child?.parent_id,
      priority,
      auditEntryId: job.payload.auditEntryId,
    },
    "incident amend parent notify (dev log — no PHI in preview)",
  );

  await incidentAuditLogTable(service).insert({
    incident_id: incidentId,
    actor_id: null,
    action: "parent_amend_notified",
    metadata: { channel: "sms_push_staged", priority },
  });
});

registerJobHandler("clearance_share_notify_business", async (job) => {
  const shareId = job.payload.shareId;
  const registrationId = job.payload.registrationId;
  if (typeof shareId !== "string" || typeof registrationId !== "string") return;

  const service = createServiceClient();
  const { data: share } = await clearanceSharesTable(service)
    .select("share_status, summary, child_id")
    .eq("id", shareId)
    .maybeSingle();

  log.info(
    {
      shareId,
      registrationId,
      orgId: job.payload.orgId,
      status: (share as { share_status?: string } | null)?.share_status,
    },
    "clearance shared with business (dev log — push to director)",
  );
});

registerJobHandler("visit_report_notify_parent", async (job) => {
  const visitReportId = job.payload.visitReportId;
  const parentId = job.payload.parentId;
  if (typeof visitReportId !== "string" || typeof parentId !== "string") return;

  const { shouldDeliverRoutinePush } = await import(
    "@/lib/notifications/delivery-policy"
  );
  const pushOk = await shouldDeliverRoutinePush(parentId);

  log.info(
    {
      visitReportId,
      parentId,
      childId: job.payload.childId,
      doctorName: job.payload.doctorName,
      pushOk,
      deferredQuietHours: !pushOk,
    },
    pushOk
      ? "visit report uploaded — notify parent (dev log — push)"
      : "visit report notify deferred (quiet hours / prefs)",
  );
});

registerJobHandler("consult_notify_admin", async (job) => {
  const consultId = job.payload.consultId;
  if (typeof consultId !== "string") return;

  log.info(
    {
      consultId,
      priority: job.payload.priority,
      parentId: job.payload.parentId,
      childId: job.payload.childId,
    },
    "new incident consult — notify on-call admin (dev log — push)",
  );
});

registerJobHandler("consult_notify_parent", async (job) => {
  const consultId = job.payload.consultId;
  const parentId = job.payload.parentId;
  if (typeof consultId !== "string" || typeof parentId !== "string") return;

  log.info(
    {
      consultId,
      parentId,
      event: job.payload.event,
    },
    "consult update — notify parent (dev log — push)",
  );
});

registerJobHandler("consent_change_notify_program", async (job) => {
  const registrationId = job.payload.registrationId;
  const programId = job.payload.programId;
  const orgId = job.payload.orgId;
  if (
    typeof registrationId !== "string" ||
    typeof programId !== "string" ||
    typeof orgId !== "string"
  ) {
    return;
  }

  log.info(
    {
      registrationId,
      programId,
      orgId,
      parentId: job.payload.parentId,
    },
    "parent consent change notify program staff (dev log — in-app)",
  );
});

registerJobHandler("message_notify_recipient", async (job) => {
  const threadId = job.payload.threadId;
  if (typeof threadId !== "string") return;

  const parentId =
    typeof job.payload.parentId === "string" ? job.payload.parentId : null;
  let pushOk = true;
  let smsOk = true;

  if (parentId) {
    const { shouldDeliverRoutinePush, shouldDeliverRoutineSms } = await import(
      "@/lib/notifications/delivery-policy"
    );
    pushOk = await shouldDeliverRoutinePush(parentId);
    smsOk = await shouldDeliverRoutineSms(parentId);
  }

  log.info(
    {
      threadId,
      messageId: job.payload.messageId,
      broadcastId: job.payload.broadcastId,
      recipientRole: job.payload.recipientRole,
      parentId,
      isBroadcast: job.payload.isBroadcast === true,
      pushOk,
      smsOk,
      deferredQuietHours: parentId ? !pushOk && !smsOk : false,
    },
    parentId && !pushOk && !smsOk
      ? "message notification deferred (quiet hours / prefs)"
      : "message notification staged (dev log — push/SMS)",
  );
});

registerJobHandler("health_check_notify_staff", async (job) => {
  const childId = job.payload.childId;
  const orgId = job.payload.orgId;
  if (typeof childId !== "string" || typeof orgId !== "string") return;

  log.info(
    {
      childId,
      orgId,
      programId: job.payload.programId,
      healthStatus: job.payload.healthStatus,
      priority: job.payload.priority,
    },
    "morning health check — notify staff (dev log — roster realtime + push)",
  );
});

registerJobHandler("generate_sms_tokens", async (job) => {
  const reportId = job.payload.reportId;
  if (typeof reportId !== "string") return;

  const { createSmsTokensForReport } = await import(
    "@/lib/reports/sms-token-service"
  );
  const result = await createSmsTokensForReport(reportId);

  log.info(
    { reportId, tokensCreated: result.tokensCreated, urlCount: result.urls.length },
    "generate_sms_tokens complete",
  );
});

registerJobHandler("account_suspend_notify", async (job) => {
  const userId = job.payload.userId;
  const reason = job.payload.reason;
  if (typeof userId !== "string") return;

  log.info(
    { userId, reason },
    "account suspended — notify user email (dev log)",
  );
});

registerJobHandler("pickup_eta_notify_business", async (job) => {
  const etaId = job.payload.etaId;
  const orgId = job.payload.orgId;
  if (typeof etaId !== "string" || typeof orgId !== "string") return;

  log.info(
    {
      etaId,
      orgId,
      childId: job.payload.childId,
      programId: job.payload.programId,
      expectedAt: job.payload.expectedAt,
      minutesLate: job.payload.minutesLate,
    },
    "pickup ETA notify business staff (dev log — roster banner)",
  );
});

registerJobHandler("coparent_invite_email", async (job) => {
  const inviteId = job.payload.inviteId;
  if (typeof inviteId !== "string") return;

  log.info(
    {
      inviteId,
      email: job.payload.email,
      childId: job.payload.childId,
    },
    "co-parent invite email (dev log)",
  );
});

registerJobHandler("generate_incident_pdf", async (job) => {
  const exportId = job.payload.exportId;
  if (typeof exportId !== "string") return;

  const { processIncidentPdfExport } = await import(
    "@/lib/incidents/incident-pdf-service"
  );
  await processIncidentPdfExport(exportId);
  log.info({ exportId }, "incident PDF export ready");
});

registerJobHandler("weekly_parent_digest", async (job) => {
  const parentId = job.payload.parentId;
  const email = job.payload.email;
  const periodKey = job.payload.periodKey;
  if (
    typeof parentId !== "string" ||
    typeof email !== "string" ||
    typeof periodKey !== "string"
  ) {
    return;
  }

  const {
    buildParentDigestSummaries,
    recordDigestSent,
    wasDigestSent,
  } = await import("@/lib/digest/digest-service");
  const { buildParentDigestHtml } = await import(
    "@/lib/digest/digest-email-templates"
  );
  const { sendTransactionalEmail } = await import("@/lib/email/resend-client");
  const { createServiceClient } = await import("@/lib/supabase/service");

  if (await wasDigestSent("parent", parentId, periodKey)) return;

  const summaries = await buildParentDigestSummaries(parentId);
  if (summaries.length === 0) return;

  const service = createServiceClient();
  const { data: profile } = await service
    .from("profiles")
    .select("full_name")
    .eq("id", parentId)
    .maybeSingle();

  const parentName = profile?.full_name?.trim() || "there";
  const html = buildParentDigestHtml(parentName, summaries);

  await sendTransactionalEmail({
    to: email,
    subject: "Your family's week on ANCHOR",
    html,
  });

  await recordDigestSent("parent", parentId, periodKey);
  log.info({ parentId, periodKey }, "weekly parent digest sent");
});

registerJobHandler("weekly_business_digest", async (job) => {
  const orgId = job.payload.orgId;
  const periodKey = job.payload.periodKey;
  const recipientEmails = job.payload.recipientEmails;
  if (
    typeof orgId !== "string" ||
    typeof periodKey !== "string" ||
    !Array.isArray(recipientEmails)
  ) {
    return;
  }

  const {
    buildBusinessDigestMetrics,
    recordDigestSent,
    wasDigestSent,
  } = await import("@/lib/digest/digest-service");
  const { buildBusinessDigestHtml } = await import(
    "@/lib/digest/digest-email-templates"
  );
  const { sendTransactionalEmail } = await import("@/lib/email/resend-client");

  if (await wasDigestSent("business", orgId, periodKey)) return;

  const metrics = await buildBusinessDigestMetrics(orgId);
  const html = buildBusinessDigestHtml(metrics);
  const emails = recipientEmails.filter((e): e is string => typeof e === "string");

  if (emails.length === 0) return;

  await sendTransactionalEmail({
    to: emails,
    subject: `${metrics.orgName} — weekly engagement digest`,
    html,
  });

  await recordDigestSent("business", orgId, periodKey);
  log.info({ orgId, periodKey, count: emails.length }, "weekly business digest sent");
});

registerJobHandler("weekly_coach_digest", async (job) => {
  const coachId = job.payload.coachId;
  const email = job.payload.email;
  const orgId = job.payload.orgId;
  const periodKey = job.payload.periodKey;
  if (
    typeof coachId !== "string" ||
    typeof email !== "string" ||
    typeof orgId !== "string" ||
    typeof periodKey !== "string"
  ) {
    return;
  }

  const { recordDigestSent, wasDigestSent } = await import("@/lib/digest/digest-service");
  const { buildCoachDigestHtml } = await import("@/lib/digest/digest-email-templates");
  const { sendTransactionalEmail } = await import("@/lib/email/resend-client");
  const { createServiceClient } = await import("@/lib/supabase/service");
  const { reportsTable } = await import("@/lib/reports/table-utils");

  if (await wasDigestSent("coach", coachId, periodKey)) return;

  const service = createServiceClient();
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();

  const { data: profile } = await service
    .from("profiles")
    .select("full_name")
    .eq("id", coachId)
    .maybeSingle();

  const { data: programIds } = await service
    .from("program_coaches")
    .select("program_id")
    .eq("user_id", coachId);

  const ids = (programIds ?? []).map((r) => r.program_id);
  let reportsThisWeek = 0;
  if (ids.length > 0) {
    const { count } = await reportsTable(service)
      .select("id", { count: "exact", head: true })
      .in("program_id", ids)
      .eq("status", "published")
      .gte("published_at", weekAgo);
    reportsThisWeek = count ?? 0;
  }

  const coachName = profile?.full_name?.trim() || "Coach";
  const html = buildCoachDigestHtml(coachName, reportsThisWeek, ids.length);

  await sendTransactionalEmail({
    to: email,
    subject: "Your coaching week on ANCHOR",
    html,
  });

  await recordDigestSent("coach", coachId, periodKey);
  log.info({ coachId, periodKey }, "weekly coach digest sent");
});

registerJobHandler("generate_compliance_export", async (job) => {
  const exportId = job.payload.exportId;
  if (typeof exportId !== "string") return;
  const { processComplianceExport } = await import(
    "@/lib/compliance/compliance-export-service"
  );
  await processComplianceExport(exportId);
  log.info({ exportId }, "compliance export processed");
});
