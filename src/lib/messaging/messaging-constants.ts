export const MAX_MESSAGE_BODY_CHARS = 2000;
export const MAX_BROADCAST_BODY_CHARS = 500;
export const BROADCAST_DAILY_LIMIT_PER_PROGRAM = 10;
export const MESSAGE_PAGE_SIZE = 50;
export const THREAD_LIST_PAGE_SIZE = 30;

export const MESSAGE_SENDER_ROLES = ["parent", "staff", "system"] as const;
export type MessageSenderRole = (typeof MESSAGE_SENDER_ROLES)[number];

export const MESSAGE_TYPES = ["text", "broadcast", "system"] as const;
export type MessageType = (typeof MESSAGE_TYPES)[number];
