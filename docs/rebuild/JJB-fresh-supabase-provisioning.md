# Fresh JJB Supabase provisioning

**Audience:** operators creating a brand-new Jiu Jitsu Brotherhood Supabase project.  
**Baseline:** [`supabase/jjb-baseline/0001_jjb_clean_baseline.sql`](../../supabase/jjb-baseline/0001_jjb_clean_baseline.sql)  
**Do not** apply `supabase/migrations/*` (historical KJJ chain) to this project.

---

## 1. Create a new Supabase project

1. In the Supabase dashboard, create a **new** project dedicated to Jiu Jitsu Brotherhood.
2. Do **not** reuse the Kingston Jiu Jitsu project, credentials, or database dumps.
3. Note the project ref (subdomain of `*.supabase.co`).

---

## 2. Apply the clean baseline

1. Confirm the project is **empty** (no prior tables beyond Supabase defaults).
2. Open **SQL Editor** in the JJB project (or use a one-off `psql` connection to that project only).
3. Run the entire contents of:

   `supabase/jjb-baseline/0001_jjb_clean_baseline.sql`

4. Confirm success (no errors). Expected: admin, settings, store, contents, storage buckets.

**Never** run `supabase db push` / migration CLI against JJB while it is pointed at `supabase/migrations/` expecting a greenfield JJB install — that path is the historical KJJ chain.

---

## 3. Required environment variables

Set in local `.env` / hosting secrets (values from the **JJB** project only):

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://<JJB_REF>.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | JJB anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | JJB service role (server-only) |
| `JJB_SUPABASE_PROJECT_REF` | Must equal `<JJB_REF>` from the URL |

Optional but recommended:

| Variable | Purpose |
| --- | --- |
| `JJB_SUPABASE_BLOCKLIST_REFS` | Comma-separated refs that must never be used (e.g. known KJJ production) |
| `NEXT_PUBLIC_SITE_URL` | Canonical site origin for Auth emails |

Store / email / Mollie vars as needed (see `.env.example`). Do not invent JJB sending domains or paste KJJ Mollie live keys.

---

## 4. JJB project-ref safety gate

Before any write migration, importer `--write`, or destructive script:

1. `JJB_SUPABASE_PROJECT_REF` must be set.
2. It must match the project ref parsed from `NEXT_PUBLIC_SUPABASE_URL`.
3. The URL ref must **not** appear in `JJB_SUPABASE_BLOCKLIST_REFS`.

Implemented in `lib/supabase/jjb-project.ts` (`assertJjbSupabaseReadyForWrites` / `assessJjbSupabaseProject`). **Do not weaken this gate.**

---

## 5. Optional KJJ blocklist

After you know the KJJ production project ref, set:

```bash
JJB_SUPABASE_BLOCKLIST_REFS=<kjj_production_ref>
```

This refuses scripts/tools that would otherwise target a blocked project if misconfigured.

---

## 6. Admin allowlist setup

The baseline does **not** seed admin emails.

1. Create the Auth user in Supabase Auth (invite or dashboard).
2. Insert allowlist row with the service role / SQL Editor:

```sql
INSERT INTO public.admin_users (user_id, email)
VALUES (
  '<auth.users.id>',
  '<admin@example.com>'
);
```

3. Complete MFA (AAL2) before product/content image uploads (storage policies require `is_admin_aal2()`).

---

## 7. Auth redirect configuration

In Supabase → Authentication → URL Configuration, add JJB redirects, for example:

- `https://www.jiujitsubrotherhood.com/admin/auth/confirm/`
- `https://www.jiujitsubrotherhood.com/admin/auth/callback/`
- Local / preview URLs as needed

Set `NEXT_PUBLIC_SITE_URL` to the canonical production origin when available.

---

## 8. Storage

Buckets and policies are created by the baseline SQL:

- `product-images` (admin AAL2 write under `products/`)
- `content-images` (admin AAL2 write under `media/` — future editorial uploads)

No files are seeded. If SQL application cannot touch `storage.*` in your environment, recreate the same bucket definitions and policies from the baseline file section 7.

---

## 9. Validation after provisioning

1. Confirm tables exist: `admin_users`, `products`, `store_orders`, `contents`, `store_fulfilment_settings`, etc.
2. Confirm `next_store_order_number()` returns a value starting with `JJB-`.
3. Confirm `store_shipping_bands` has **zero** rows and `uk_shipping_enabled = false`.
4. Confirm collection row: label `Collect at Kingston Jiu Jitsu`, empty instructions, `collection_enabled = true`.
5. Confirm `site_settings` / `tracking_settings` have null/disabled identity (no Kingston email/venues).
6. Confirm no `articles` / `site_pages` tables.
7. Run static check: `node scripts/validate-jjb-baseline.mjs`
8. Only after env gate is green: optional importer dry-run (no `--write`).

---

## 10. Rollback / recreate (before production data)

Until real customers/orders/content exist:

1. Prefer **delete and recreate** the Supabase project, then re-apply the baseline.
2. Or drop public objects carefully and re-run the baseline (harder; recreate is safer).
3. Rotate keys if credentials were ever mixed with KJJ.

After production data exists, do **not** re-apply the baseline; use forward-only additive migrations under a JJB-specific process.

---

## 11. What not to do

- Do not connect to KJJ Supabase.
- Do not apply historical `supabase/migrations/*` to JJB.
- Do not seed fake content, KJJ shipping rates, or invented legal copy.
- Do not run importer `--write` until the project gate passes.
- Do not enable public collection in the app until the known checkout hard-block is deliberately removed (see Phase 2E audit notes).
