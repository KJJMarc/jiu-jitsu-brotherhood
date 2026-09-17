import "server-only";

import { createClient } from "@supabase/supabase-js";
import {
  requireSupabaseAnonKey,
  requireSupabaseUrl,
} from "@/lib/supabase/env";

/** ISR window for public published-article reads (matches timetable fetch). */
const PUBLIC_ARTICLES_REVALIDATE_SECONDS = 300;

/**
 * Cookie-free anon client for public, RLS-scoped reads (e.g. published articles).
 * Safe to use during `generateStaticParams` / build — does not call `cookies()`,
 * and uses a cacheable fetch so consumers like `sitemap.ts` stay static.
 */
export function createSupabasePublicClient() {
  return createClient(requireSupabaseUrl(), requireSupabaseAnonKey(), {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      fetch: (url, init) =>
        fetch(url, {
          ...init,
          // Override any no-store default so SSG/ISR can prerender.
          cache: "force-cache",
          next: { revalidate: PUBLIC_ARTICLES_REVALIDATE_SECONDS },
        }),
    },
  });
}
