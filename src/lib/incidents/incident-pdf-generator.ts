import PDFDocument from "pdfkit";
import type { IncidentAuditEntry, IncidentDetail } from "@/lib/incidents/incident-types";

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function auditActionLabel(entry: IncidentAuditEntry): string {
  const action = entry.action.replace(/_/g, " ");
  return `${action} — ${formatDate(entry.createdAt)} (${entry.actorLabel ?? "System"})`;
}

export async function generateIncidentPdfBuffer(detail: IncidentDetail): Promise<Buffer> {
  const doc = new PDFDocument({ margin: 48, size: "A4" });
  const chunks: Buffer[] = [];

  doc.on("data", (chunk: Buffer) => chunks.push(chunk));

  const done = new Promise<Buffer>((resolve, reject) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });

  const childName = `${detail.childFirstName} ${detail.childLastName}`.trim();
  const typeLabel = detail.incidentType.replace(/_/g, " ");

  doc
    .fontSize(20)
    .fillColor("#1B2B4B")
    .text(detail.orgName || "ANCHOR Care", { align: "left" });
  doc.moveDown(0.3);
  doc.fontSize(11).fillColor("#5c6470").text("Incident insurance export");
  doc.moveDown(1);

  doc.fontSize(16).fillColor("#1B2B4B").text("Incident report");
  doc.moveDown(0.5);
  doc.fontSize(12).fillColor("#1B2B4B");
  doc.text(`Child: ${childName}`);
  doc.text(`Program: ${detail.programName}`);
  doc.text(`Type: ${typeLabel}`);
  doc.text(`Severity: ${detail.severity}${detail.isRedFlag ? " (urgent)" : ""}`);
  doc.text(`Occurred: ${formatDate(detail.occurredAt)}`);
  doc.text(`Status: ${detail.status}`);
  doc.moveDown(0.75);

  const fields: [string, string | null | undefined][] = [
    ["Location", detail.location],
    ["Mechanism", detail.mechanism],
    ["Body area", detail.bodyArea?.replace(/_/g, " ")],
    ["Symptoms", detail.symptoms],
    ["Pain level", detail.painLevel != null ? String(detail.painLevel) : null],
    ["Actions taken", detail.actionTaken],
    [
      "Witnesses",
      detail.witnesses.length
        ? detail.witnesses
            .map((w) => `${w.name}${w.role ? ` (${w.role})` : ""}`)
            .join(", ")
        : null,
    ],
  ];

  for (const [label, value] of fields) {
    doc.font("Helvetica-Bold").text(`${label}:`, { continued: false });
    doc.font("Helvetica").text(value?.trim() ? value : "—");
    doc.moveDown(0.35);
  }

  if (detail.parentNotifiedAt) {
    doc.moveDown(0.5);
    doc.font("Helvetica-Bold").text("Parent notification");
    doc.font("Helvetica").text(`Notified at ${formatDate(detail.parentNotifiedAt)}`);
  }

  doc.moveDown(0.75);
  doc.font("Helvetica-Bold").fontSize(13).text("Audit & notification log");
  doc.moveDown(0.35);
  doc.font("Helvetica").fontSize(11);

  if (detail.auditTrail.length === 0) {
    doc.text("No audit entries recorded.");
  } else {
    for (const entry of detail.auditTrail) {
      doc.text(auditActionLabel(entry));
      if (entry.diff.length > 0) {
        for (const d of entry.diff) {
          doc.text(`  • ${d.field}: "${d.before}" → "${d.after}"`);
        }
      }
      doc.moveDown(0.25);
    }
  }

  if (detail.photos.length > 0) {
    doc.moveDown(0.5);
    doc.font("Helvetica-Bold").text(`Attached photos: ${detail.photos.length}`);
    doc.font("Helvetica").text(
      "Photo files are stored securely in ANCHOR. Reference incident ID when submitting to your insurer.",
    );
  }

  doc.moveDown(1);
  doc.fontSize(9).fillColor("#8a9199").text(
    `Generated ${formatDate(new Date().toISOString())} · Incident ID ${detail.id}`,
    { align: "center" },
  );

  doc.end();
  return done;
}
