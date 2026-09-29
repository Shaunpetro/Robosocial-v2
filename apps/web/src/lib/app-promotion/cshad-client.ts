// apps/web/src/lib/app-promotion/cshad-client.ts
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | null = null;

/**
 * Returns a singleton read-only Supabase client for the CSHAD project.
 * Throws if the required environment variables are not configured.
 *
 * The credentials should belong to a read-only Postgres role scoped to
 * `SELECT` on `news` and `opportunities` only. Do not use the CSHAD service
 * role here.
 */
export function getCshadClient(): SupabaseClient {
  if (cached) return cached;

  const url = process.env.CSHAD_SUPABASE_URL;
  const key = process.env.CSHAD_SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "CSHAD_SUPABASE_URL and CSHAD_SUPABASE_SERVICE_ROLE_KEY must be set."
    );
  }

  cached = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}