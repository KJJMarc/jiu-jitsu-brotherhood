import assert from "node:assert/strict";
import {
  getMollieConfiguredMode,
  resolveMollieApiKey,
} from "../lib/store/mollie-key.ts";

function assertRejects(env, needle) {
  const result = resolveMollieApiKey(env);
  assert.equal(result.ok, false);
  assert.match(result.error, needle);
}

// TEST keys always accepted
{
  const r = resolveMollieApiKey({ MOLLIE_API_KEY: "test_abc" });
  assert.equal(r.ok, true);
  if (r.ok) {
    assert.equal(r.mode, "test");
    assert.equal(r.key, "test_abc");
  }
  assert.equal(getMollieConfiguredMode({ MOLLIE_API_KEY: "test_abc" }), "test");
}

// Missing key
assertRejects({}, /not configured/i);

// Unknown prefix
assertRejects({ MOLLIE_API_KEY: "sk_live_nope" }, /must start with test_/i);

// live_ without allow flag
assertRejects(
  { MOLLIE_API_KEY: "live_abc", VERCEL_ENV: "production" },
  /MOLLIE_ALLOW_LIVE=true/,
);

// live_ with wrong allow value
assertRejects(
  {
    MOLLIE_API_KEY: "live_abc",
    MOLLIE_ALLOW_LIVE: "1",
    VERCEL_ENV: "production",
  },
  /MOLLIE_ALLOW_LIVE=true/,
);

// live_ allowed in production
{
  const r = resolveMollieApiKey({
    MOLLIE_API_KEY: "live_abc",
    MOLLIE_ALLOW_LIVE: "true",
    VERCEL_ENV: "production",
  });
  assert.equal(r.ok, true);
  if (r.ok) assert.equal(r.mode, "live");
}

// live_ blocked on preview even with allow flag
assertRejects(
  {
    MOLLIE_API_KEY: "live_abc",
    MOLLIE_ALLOW_LIVE: "true",
    VERCEL_ENV: "preview",
  },
  /preview\/development/i,
);

// live_ blocked on Vercel development
assertRejects(
  {
    MOLLIE_API_KEY: "live_abc",
    MOLLIE_ALLOW_LIVE: "true",
    VERCEL_ENV: "development",
  },
  /preview\/development/i,
);

// Without VERCEL_ENV (local), allow + live_ is accepted (ops local only)
{
  const r = resolveMollieApiKey({
    MOLLIE_API_KEY: "live_abc",
    MOLLIE_ALLOW_LIVE: "true",
  });
  assert.equal(r.ok, true);
  if (r.ok) assert.equal(r.mode, "live");
}

// test_ still works when allow live is set (no accidental force to live)
{
  const r = resolveMollieApiKey({
    MOLLIE_API_KEY: "test_abc",
    MOLLIE_ALLOW_LIVE: "true",
    VERCEL_ENV: "production",
  });
  assert.equal(r.ok, true);
  if (r.ok) assert.equal(r.mode, "test");
}

console.log("mollie-live-guard: ok");
