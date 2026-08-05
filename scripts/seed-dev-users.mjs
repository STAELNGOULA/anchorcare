/**
 * Creates dev coach + admin login users in Supabase Auth + profiles.
 * Usage: npm run db:seed-dev-users
 *
 * Requires .env.local: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { resolve } from "node:path";

config({ path: resolve(process.cwd(), ".env.local") });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

/** Dev-only credentials — rotate if exposed beyond local */
const DEV_USERS = [
  {
    email: "coach@anchor.dev",
    password: "AnchorCoach1!",
    role: "coach",
    fullName: "Demo Coach",
  },
  {
    email: "admin@anchor.dev",
    password: "AnchorAdmin1!",
    role: "admin",
    fullName: "Platform Admin",
  },
];

async function findUserByEmail(email) {
  let page = 1;
  const perPage = 200;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw error;

    const match = data.users.find(
      (user) => user.email?.toLowerCase() === email.toLowerCase(),
    );
    if (match) return match;

    if (data.users.length < perPage) return null;
    page += 1;
  }
}

async function ensureProfile(userId, role, fullName) {
  const { error } = await supabase.from("profiles").upsert(
    {
      id: userId,
      role,
      full_name: fullName,
      onboarding_status: "active",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  );

  if (error) throw error;
}

async function ensureUser(user) {
  const existing = await findUserByEmail(user.email);

  if (existing) {
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      existing.id,
      {
        password: user.password,
        email_confirm: true,
        user_metadata: { role: user.role, full_name: user.fullName },
      },
    );
    if (updateError) throw updateError;

    await ensureProfile(existing.id, user.role, user.fullName);
    console.log(`✓ Updated ${user.email} → role=${user.role}`);
    return;
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email: user.email,
    password: user.password,
    email_confirm: true,
    user_metadata: { role: user.role, full_name: user.fullName },
  });

  if (error) throw error;
  if (!data.user) throw new Error(`No user returned for ${user.email}`);

  await ensureProfile(data.user.id, user.role, user.fullName);
  console.log(`✓ Created ${user.email} → role=${user.role}`);
}

async function main() {
  console.log("Seeding dev coach + admin users…\n");

  for (const user of DEV_USERS) {
    await ensureUser(user);
  }

  console.log("\nLogin at /login with:\n");
  for (const user of DEV_USERS) {
    console.log(`  ${user.role.padEnd(6)} ${user.email} / ${user.password}`);
  }
  console.log("\nCoach home: /coach/programs");
  console.log("Admin home: /admin/dashboard");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
