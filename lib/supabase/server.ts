import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { requireSupabaseAnonKey, requireSupabaseUrl } from "@/lib/supabase/env";

/**
 * Cookie-backed Supabase client for Server Components, Server Actions, and
 * Route Handlers. Uses the anon key only — never the service role.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  const supabaseUrl = requireSupabaseUrl();
  const supabaseAnonKey = requireSupabaseAnonKey();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(
        cookiesToSet: {
          name: string;
          value: string;
          options?: Record<string, unknown>;
        }[],
      ) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // setAll can fail in Server Components; middleware refreshes sessions.
        }
      },
    },
  });
}
