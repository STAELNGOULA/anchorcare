export type TeamProgramOption = {
  id: string;
  name: string;
  status: string;
};

export type TeamMemberItem = {
  userId: string;
  email: string;
  fullName: string;
  role: "coach" | "staff" | "director";
  isActive: boolean;
  deactivatedAt: string | null;
  programIds: string[];
  programNames: string[];
  joinedAt: string;
};

export type PendingCoachInvite = {
  id: string;
  email: string | null;
  programIds: string[];
  assignAllPrograms: boolean;
  expiresAt: string;
  createdAt: string;
  inviteUrl?: string;
};

export type CreateCoachInviteInput = {
  email: string;
  programIds: string[];
  assignAllPrograms: boolean;
};

export type UpdateTeamMemberInput = {
  programIds: string[];
  assignAllPrograms: boolean;
  isActive: boolean;
};
