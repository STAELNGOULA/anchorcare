export type HandoffNote = {
  id: string;
  orgId: string;
  programId: string;
  programName: string;
  authorId: string;
  authorName: string;
  shiftDate: string;
  note: string;
  createdAt: string;
};

export type CreateHandoffNoteInput = {
  programId: string;
  note: string;
  shiftDate?: string;
};
