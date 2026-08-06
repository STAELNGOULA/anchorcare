import {
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const jobStatusEnum = [
  "pending",
  "processing",
  "completed",
  "failed",
  "dead_letter",
] as const;

export const jobTypeEnum = [
  "notification_push",
  "notification_sms",
  "notification_email",
  "voice_transcribe",
  "voice_draft_reports",
  "notify_parents",
  "generate_sms_tokens",
  "incident_notify_parent",
  "incident_amend_notify_parent",
  "clearance_share_notify_business",
  "message_notify_recipient",
] as const;

export const backgroundJobs = pgTable("background_jobs", {
  id: uuid("id").primaryKey().defaultRandom(),
  type: text("type", { enum: jobTypeEnum }).notNull(),
  status: text("status", { enum: jobStatusEnum }).notNull().default("pending"),
  payload: jsonb("payload").notNull().default({}),
  idempotencyKey: text("idempotency_key").unique(),
  attempts: integer("attempts").notNull().default(0),
  maxAttempts: integer("max_attempts").notNull().default(3),
  nextRunAt: timestamp("next_run_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  lastError: text("last_error"),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const RETRY_DELAYS_MS = [5 * 60_000, 15 * 60_000, 60 * 60_000] as const;
