import type { Database } from "@/types/supabase";
import { createBrowserClient } from "@supabase/ssr";

type BrowserClient = ReturnType<typeof createBrowserClient<Database>>;

let clientInstance: BrowserClient | null = null;

export function createClient() {
  if (clientInstance) return clientInstance;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error("Supabase credentials not configured");
  }

  clientInstance = createBrowserClient<Database>(url, key, {
    isSingleton: true,
  });

  return clientInstance;
}
