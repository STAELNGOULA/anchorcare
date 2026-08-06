import type { MessageSenderRole, MessageType } from "@/lib/messaging/messaging-constants";

export type MessageThreadListItem = {
  id: string;
  orgId: string;
  programId: string;
  childId: string;
  childFirstName: string;
  childLastName: string;
  programName: string;
  orgName: string;
  lastMessageAt: string | null;
  lastMessagePreview: string | null;
  unread: boolean;
};

export type MessageItem = {
  id: string;
  threadId: string;
  senderId: string | null;
  senderRole: MessageSenderRole;
  senderLabel: string;
  body: string;
  messageType: MessageType;
  createdAt: string;
  isOwn: boolean;
};

export type MessageThreadDetail = MessageThreadListItem & {
  parentId: string;
  safetyBanner: true;
};

export type SendMessageInput = {
  body: string;
};

export type BroadcastProgramOption = {
  id: string;
  name: string;
  activeFamilyCount: number;
};

export type SendBroadcastInput = {
  programId: string;
  body: string;
};

export type EnsureThreadInput = {
  programId: string;
  childId: string;
  registrationId?: string;
};
