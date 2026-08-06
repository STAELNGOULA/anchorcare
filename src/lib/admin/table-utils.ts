import type { createServiceClient } from "@/lib/supabase/service";

type ServiceClient = ReturnType<typeof createServiceClient>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function adminAuditLogTable(service: ServiceClient): any {
  return service.from("admin_audit_log" as "profiles");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function slugDisputesTable(service: ServiceClient): any {
  return service.from("slug_disputes" as "profiles");
}
