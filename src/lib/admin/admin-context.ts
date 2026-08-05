import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export type AdminContext = {
  userId: string;
  email: string;
  displayName: string;
  pendingConsults: number;
};

function deriveDisplayName(fullName: string | null, email: string): string {
  if (fullName?.trim()) {
    return fullName.trim().split(/\s+/)[0] ?? "Admin";
  }
  const local = email.split("@")[0] ?? "Admin";
  return local.charAt(0).toUpperCase() + local.slice(1);
}

export async function getAdminContext(): Promise<AdminContext> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/admin/dashboard");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin") {
    redirect("/login");
  }

  const email = user.email ?? "";

  return {
    userId: user.id,
    email,
    displayName: deriveDisplayName(profile?.full_name ?? null, email),
    pendingConsults: 0,
  };
}
