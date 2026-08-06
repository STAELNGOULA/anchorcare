const MAX_SUMMARY = 8000;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function validateVisitReportInput(input: {
  childId?: unknown;
  doctorId?: unknown;
  doctorName?: unknown;
  appointmentDate?: unknown;
  summary?: unknown;
  pdfStoragePath?: unknown;
}): { ok: true; data: Record<string, unknown> } | { ok: false; error: string } {
  const childId = typeof input.childId === "string" ? input.childId.trim() : "";
  if (!childId) return { ok: false, error: "invalid_child" };

  const doctorName =
    typeof input.doctorName === "string" ? input.doctorName.trim() : "";
  if (!doctorName || doctorName.length > 120) {
    return { ok: false, error: "invalid_doctor_name" };
  }

  const appointmentDate =
    typeof input.appointmentDate === "string" ? input.appointmentDate.trim() : "";
  if (!DATE_RE.test(appointmentDate)) {
    return { ok: false, error: "invalid_date" };
  }

  const summary =
    typeof input.summary === "string" ? input.summary.trim() : "";
  if (!summary || summary.length > MAX_SUMMARY) {
    return { ok: false, error: "invalid_summary" };
  }

  const doctorId =
    typeof input.doctorId === "string" && input.doctorId.trim()
      ? input.doctorId.trim()
      : null;

  const pdfStoragePath =
    typeof input.pdfStoragePath === "string" && input.pdfStoragePath.trim()
      ? input.pdfStoragePath.trim()
      : null;

  return {
    ok: true,
    data: { childId, doctorId, doctorName, appointmentDate, summary, pdfStoragePath },
  };
}
