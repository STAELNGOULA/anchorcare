import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const userRoleEnum = [
  "parent",
  "business_admin",
  "coach",
  "admin",
] as const;

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(),
  role: text("role", { enum: userRoleEnum }).notNull().default("parent"),
  onboardingStatus: text("onboarding_status", {
    enum: ["pending_link", "program_setup", "active"],
  })
    .notNull()
    .default("active"),
  fullName: text("full_name"),
  country: text("country"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export * from "./jobs";
