/**
 * Create / bootstrap a KJJ admin (CLI recovery / first admin).
 *
 * Prefer Admin → Admin Access in the console to invite additional admins.
 * Keep this script for the first admin or emergency recovery.
 *
 * Prerequisites:
 *   - Dedicated KJJ Supabase project
 *   - Migration 20260911120000_admin_users.sql applied
 *   - Auth → Providers → Email enabled; "Confirm email" as you prefer
 *   - Auth → Providers: disable public sign-ups ("Allow new users to sign up" OFF)
 *   - .env.local with NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
 *     SUPABASE_SERVICE_ROLE_KEY
 *
 * Usage:
 *   node --env-file=.env.local scripts/create-admin.mjs admin@example.com 'StrongPassword123!'
 *
 * Or with env vars already exported:
 *   node scripts/create-admin.mjs admin@example.com 'StrongPassword123!'
 */

import { createClient } from "@supabase/supabase-js";

const email = process.argv[2]?.trim().toLowerCase();
const password = process.argv[3];

if (!email || !password) {
  console.error(
    "Usage: node scripts/create-admin.mjs <email> <password>",
  );
  process.exit(1);
}

if (password.length < 10) {
  console.error("Password must be at least 10 characters.");
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

if (!url || !serviceKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.",
  );
  process.exit(1);
}

if (anonKey && serviceKey === anonKey) {
  console.error("SUPABASE_SERVICE_ROLE_KEY must not be the anon key.");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { data: created, error: createError } =
  await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

let userId = created?.user?.id ?? null;

if (createError) {
  // If the Auth user already exists, look them up and continue to allowlist.
  const msg = createError.message?.toLowerCase() ?? "";
  if (!msg.includes("already") && !msg.includes("registered")) {
    console.error("Failed to create auth user:", createError.message);
    process.exit(1);
  }

  const { data: listed, error: listError } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  });

  if (listError) {
    console.error("Failed to list users:", listError.message);
    process.exit(1);
  }

  const existing = listed.users.find(
    (u) => u.email?.toLowerCase() === email,
  );

  if (!existing) {
    console.error(
      "Auth user appears to exist but could not be found by email. Add them via the Dashboard, then insert into admin_users.",
    );
    process.exit(1);
  }

  userId = existing.id;
  console.log(`Auth user already exists for ${email}; updating allowlist.`);
} else {
  console.log(`Created auth user ${email} (${userId}).`);
}

const { error: upsertError } = await supabase.from("admin_users").upsert(
  {
    user_id: userId,
    email,
  },
  { onConflict: "user_id" },
);

if (upsertError) {
  console.error("Failed to upsert admin_users:", upsertError.message);
  process.exit(1);
}

console.log(`Allowlisted admin: ${email}`);
console.log("They can sign in at /admin/login/");
