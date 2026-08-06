type EnrolledChild = {
  childId: string;
  registrationId: string;
  firstName: string;
  lastName: string;
};

const ORPHAN_PROBE_NAME = "Jamie";

export function buildStubTranscript(children: EnrolledChild[]): string {
  const names = children.map((c) => c.firstName);
  const rosterNames = names.length > 0 ? names.join(", ") : "the group";
  return `Today's session went well. ${rosterNames} showed great effort and teamwork. ${ORPHAN_PROBE_NAME} also participated for part of practice.`;
}

export function detectOrphanNames(
  transcript: string,
  children: EnrolledChild[],
): string[] {
  const roster = new Set(
    children.map((c) => c.firstName.toLowerCase()),
  );
  const words = transcript.match(/\b[A-Z][a-z]+\b/g) ?? [];
  const orphans = new Set<string>();

  for (const word of words) {
    const lower = word.toLowerCase();
    if (roster.has(lower)) continue;
    if (["Today", "The", "Also", "Great", "Session"].includes(word)) continue;
    orphans.add(word);
  }

  return Array.from(orphans);
}

export function buildChildDraft(firstName: string, programName: string): string {
  return `${firstName} had a strong day at ${programName}. Great energy, listened well to coaching, and made solid progress with the group.`;
}

export type GeneratedDraftRow = {
  childId: string | null;
  registrationId: string | null;
  mentionedName: string | null;
  aiDraftText: string;
  draftText: string;
  transcript: string | null;
  misassignedFlag: boolean;
  status: "draft" | "flagged";
  sortOrder: number;
};

export function generateReportChildDrafts(
  children: EnrolledChild[],
  programName: string,
  groupTranscript: string,
): GeneratedDraftRow[] {
  const rows: GeneratedDraftRow[] = children.map((child, index) => {
    const draft = buildChildDraft(child.firstName, programName);
    return {
      childId: child.childId,
      registrationId: child.registrationId,
      mentionedName: null,
      aiDraftText: draft,
      draftText: draft,
      transcript: groupTranscript,
      misassignedFlag: false,
      status: "draft",
      sortOrder: index,
    };
  });

  const orphans = detectOrphanNames(groupTranscript, children);
  orphans.forEach((name, index) => {
    rows.push({
      childId: null,
      registrationId: null,
      mentionedName: name,
      aiDraftText: `Mentioned in recording: "${name}" may not be in this program group.`,
      draftText: `Mentioned in recording: "${name}" may not be in this program group.`,
      transcript: groupTranscript,
      misassignedFlag: true,
      status: "flagged",
      sortOrder: children.length + index,
    });
  });

  return rows;
}
