import type { BusinessDigestMetrics, ParentDigestChildSummary } from "@/lib/digest/digest-types";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://anchrcare.com";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildParentDigestHtml(
  parentName: string,
  summaries: ParentDigestChildSummary[],
): string {
  const childBlocks = summaries
    .map((s) => {
      const highlights = [
        s.reportsCount > 0
          ? `${s.reportsCount} daily report${s.reportsCount === 1 ? "" : "s"}`
          : null,
        s.photoCount > 0 ? `${s.photoCount} new photos` : null,
        s.incidentCount > 0
          ? `${s.incidentCount} incident${s.incidentCount === 1 ? "" : "s"} logged`
          : null,
      ]
        .filter(Boolean)
        .join(" · ");

      return `
        <div style="margin:16px 0;padding:16px;border:1px solid #e8e0d4;border-radius:12px;background:#faf7f2;">
          <p style="margin:0 0 4px;font-size:18px;font-weight:600;color:#1B2B4B;">${escapeHtml(s.childName)}</p>
          <p style="margin:0 0 8px;font-size:14px;color:#5c6470;">${escapeHtml(s.programName)}</p>
          <p style="margin:0;font-size:14px;color:#1B2B4B;">${highlights || "Quiet week — their program team is ready when you need them."}</p>
        </div>
      `;
    })
    .join("");

  return `
    <div style="font-family:system-ui,-apple-system,sans-serif;max-width:560px;margin:0 auto;color:#1B2B4B;">
      <p style="font-size:14px;color:#5c6470;">Your weekly recap</p>
      <h1 style="font-size:24px;margin:8px 0 16px;">Hi ${escapeHtml(parentName)}, here's your family's week</h1>
      <p style="font-size:15px;line-height:1.5;color:#3d4654;">
        A calm summary of what mattered — reports, photos, and safety updates across your children.
      </p>
      ${childBlocks}
      <p style="margin:24px 0;">
        <a href="${APP_URL}/parent/today" style="display:inline-block;padding:12px 20px;background:#4ECDC4;color:#1B2B4B;text-decoration:none;border-radius:10px;font-weight:600;">
          Open Today
        </a>
      </p>
      <p style="font-size:12px;color:#8a9199;">Manage digest settings in You → Consents.</p>
    </div>
  `;
}

export function buildBusinessDigestHtml(metrics: BusinessDigestMetrics): string {
  const trialLine =
    metrics.trialDaysLeft != null
      ? `<p style="margin:12px 0;padding:12px;background:#fff8e6;border-radius:8px;font-size:14px;">
          <strong>${metrics.trialDaysLeft} days left</strong> on your ANCHOR Pro trial — keep parent engagement visible before renewal.
        </p>`
      : "";

  const waporLine =
    metrics.waporPercent != null
      ? `<li>Report open rate: <strong>${metrics.waporPercent}%</strong></li>`
      : "";

  return `
    <div style="font-family:system-ui,-apple-system,sans-serif;max-width:560px;margin:0 auto;color:#1B2B4B;">
      <p style="font-size:14px;color:#5c6470;">Weekly director digest</p>
      <h1 style="font-size:24px;margin:8px 0 16px;">${escapeHtml(metrics.orgName)} — engagement snapshot</h1>
      ${trialLine}
      <ul style="padding:0;margin:16px 0;list-style:none;">
        <li style="margin:8px 0;">Family activation: <strong>${metrics.activationPercent}%</strong></li>
        <li style="margin:8px 0;">Reports published this week: <strong>${metrics.reportsThisWeek}</strong></li>
        <li style="margin:8px 0;">Incidents (7 days): <strong>${metrics.incidents7d}</strong></li>
        <li style="margin:8px 0;">Voice report days: <strong>${metrics.voiceDaysUsed}</strong></li>
        ${waporLine}
        <li style="margin:8px 0;">Families who read a report: <strong>${metrics.funnelReportRead}</strong> of ${metrics.funnelRegistered} registered</li>
      </ul>
      <p style="margin:24px 0;">
        <a href="${APP_URL}/business/dashboard" style="display:inline-block;padding:12px 20px;background:#4ECDC4;color:#1B2B4B;text-decoration:none;border-radius:10px;font-weight:600;">
          View dashboard
        </a>
      </p>
      <p style="font-size:12px;color:#8a9199;">Configure digest in Settings → Weekly digest.</p>
    </div>
  `;
}

export function buildCoachDigestHtml(
  coachName: string,
  reportsThisWeek: number,
  programsCount: number,
): string {
  return `
    <div style="font-family:system-ui,-apple-system,sans-serif;max-width:560px;margin:0 auto;color:#1B2B4B;">
      <p style="font-size:14px;color:#5c6470;">Coach weekly summary</p>
      <h1 style="font-size:24px;margin:8px 0 16px;">${escapeHtml(coachName)}, your consistency counts</h1>
      <p style="font-size:15px;line-height:1.5;color:#3d4654;">
        You published <strong>${reportsThisWeek}</strong> report${reportsThisWeek === 1 ? "" : "s"} this week across
        <strong>${programsCount}</strong> assigned program${programsCount === 1 ? "" : "s"}.
        Parents notice when updates land before pickup.
      </p>
      <p style="margin:24px 0;">
        <a href="${APP_URL}/coach/report" style="display:inline-block;padding:12px 20px;background:#4ECDC4;color:#1B2B4B;text-decoration:none;border-radius:10px;font-weight:600;">
          Open voice report
        </a>
      </p>
    </div>
  `;
}
