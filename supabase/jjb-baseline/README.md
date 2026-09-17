# JJB clean database baseline (fresh install only)

**Location:** `supabase/jjb-baseline/`  
**Audience:** empty Jiu Jitsu Brotherhood Supabase projects only.

## Two paths — do not confuse them

| Path | Purpose |
| --- | --- |
| `supabase/migrations/` | **Historical** KJJ-derived migration chain (25 files). Provenance / existing environments. **Do not apply to a new JJB project.** |
| `supabase/jjb-baseline/` | **Fresh JJB install.** Final required schema for an empty JJB Supabase project. |

This baseline is **not** registered in Supabase’s normal `supabase/migrations` sequence, so `supabase db push` / linked migration runners that only watch `migrations/` will not accidentally apply it to a KJJ database.

## Install file

Apply exactly once to an **empty** JJB project:

```text
supabase/jjb-baseline/0001_jjb_clean_baseline.sql
```

Full procedure: [`docs/rebuild/JJB-fresh-supabase-provisioning.md`](../../docs/rebuild/JJB-fresh-supabase-provisioning.md).

## Explicit non-goals

- Do not replay `supabase/migrations/*` against JJB.
- Do not apply this baseline to Kingston Jiu Jitsu production or any KJJ project.
- Do not seed admin emails, KJJ site identity, or UK shipping rates.
