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
  emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  accountStatus: text("account_status", { enum: ["active", "suspended"] })
    .notNull()
    .default("active"),
  fullName: text("full_name"),
  country: text("country"),
  region: text("region"),
  signupSource: text("signup_source", {
    enum: ["organic", "public_page", "invite"],
  })
    .notNull()
    .default("organic"),
  termsAcceptedAt: timestamp("terms_accepted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export * from "./jobs";
