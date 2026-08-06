export type GuardianPermission = "view" | "full";

export type CoparentGuardian = {
  id: string;
  childId: string;
  guardianUserId: string;
  guardianEmail: string | null;
  guardianName: string | null;
  permission: GuardianPermission;
  createdAt: string;
};

export type CoparentInvite = {
  id: string;
  childId: string;
  inviteEmail: string;
  permission: GuardianPermission;
  status: "pending" | "accepted" | "revoked" | "expired";
  expiresAt: string;
  createdAt: string;
};

export type CoparentChildState = {
  childId: string;
  firstName: string;
  lastName: string;
  guardians: CoparentGuardian[];
  pendingInvites: CoparentInvite[];
};

export type CoparentWorkspaceData = {
  children: CoparentChildState[];
};

export type CreateCoparentInviteInput = {
  childId: string;
  inviteEmail: string;
  permission: GuardianPermission;
};
