"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/env";

/**
 * Browser Supabase client for admin auth confirm (invite / recovery).
 * Uses the anon key only. Session is stored in cookies via @supabase/ssr.
 */
export function createSupabaseBrowserClient() {
  const url = getSupabaseUrl();
  const anonKey = getSupabaseAnonKey();

  if (!url || !anonKey) {
    throw new Error("Supabase is not configured.");
  }

  return createBrowserClient(url, anonKey);
}
