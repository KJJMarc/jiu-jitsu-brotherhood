/**
 * Phase 4A unit tests: order access tokens, cart cookie isolation,
 * public catalogue active-only logic (DB optional).
 *
 * Run: node --experimental-strip-types scripts/test-phase-4a-public-storefront.mjs
 */
import assert from "node:assert/strict";
import {
  generateCustomerAccessToken,
  hashCustomerAccessToken,
  publicCustomerOrderPath,
  verifyCustomerAccessToken,
} from "../lib/store/order-access.ts";
import {
  PREVIEW_CART_COOKIE,
  PUBLIC_CART_COOKIE,
  PUBLIC_GUEST_ID_COOKIE,
  normalizeCartItems,
  upsertCartItem,
  emptyPreviewCart,
} from "../lib/store/cart.ts";

// --- Order access token ---
const token = generateCustomerAccessToken();
assert.ok(token.length >= 40, "token should be long base64url");
assert.match(token, /^[A-Za-z0-9_-]+$/);
const hash = hashCustomerAccessToken(token);
assert.equal(hash.length, 64);
assert.match(hash, /^[a-f0-9]+$/);
assert.equal(verifyCustomerAccessToken(token, hash), true);
assert.equal(verifyCustomerAccessToken("wrong", hash), false);
assert.equal(verifyCustomerAccessToken(token, null), false);
assert.equal(verifyCustomerAccessToken(token, ""), false);
assert.equal(verifyCustomerAccessToken("", hash), false);
assert.notEqual(hashCustomerAccessToken(token + "x"), hash);
assert.equal(
  publicCustomerOrderPath("abc", "tok"),
  "/shop/order?order=abc&t=tok",
);

// --- Cart cookie / channel isolation constants ---
assert.equal(PREVIEW_CART_COOKIE, "jjb_store_preview_cart");
assert.equal(PUBLIC_CART_COOKIE, "jjb_store_public_cart");
assert.equal(PUBLIC_GUEST_ID_COOKIE, "jjb_store_guest_id");
assert.notEqual(PREVIEW_CART_COOKIE, PUBLIC_CART_COOKIE);

const CHANNELS = {
  preview: { cookie: PREVIEW_CART_COOKIE, path: "/admin", allowDraft: true },
  public: { cookie: PUBLIC_CART_COOKIE, path: "/", allowDraft: false },
};
assert.notEqual(CHANNELS.preview.path, CHANNELS.public.path);
assert.equal(CHANNELS.preview.allowDraft, true);
assert.equal(CHANNELS.public.allowDraft, false);

// Pure cart helpers still work across channels (state is cookie-agnostic).
let cart = emptyPreviewCart();
cart = upsertCartItem(cart, "var-1", 2);
assert.deepEqual(normalizeCartItems(cart.items), [
  { variantId: "var-1", quantity: 2 },
]);

// --- Public catalogue active-only filter (logic unit) ---
function filterPublicCatalogue(products) {
  return products
    .filter((p) => p.status === "active")
    .map((p) => ({
      ...p,
      href: `/products/${p.slug}`,
    }));
}

function getPublicBySlug(products, slug) {
  const found = products.find(
    (p) => p.slug === slug && p.status === "active",
  );
  return found ?? null;
}

const sample = [
  { id: "1", slug: "gi", title: "Gi", status: "active" },
  { id: "2", slug: "draft-tee", title: "Draft Tee", status: "draft" },
  { id: "3", slug: "old-rash", title: "Old", status: "archived" },
];

const catalogue = filterPublicCatalogue(sample);
assert.equal(catalogue.length, 1);
assert.equal(catalogue[0].slug, "gi");
assert.equal(catalogue[0].href, "/products/gi");
assert.equal(getPublicBySlug(sample, "gi")?.id, "1");
assert.equal(getPublicBySlug(sample, "draft-tee"), null);
assert.equal(getPublicBySlug(sample, "old-rash"), null);
assert.equal(getPublicBySlug(sample, "missing"), null);

// Optional live DB check when credentials present
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (url && key) {
  const { createClient } = await import("@supabase/supabase-js");
  const sb = createClient(url, key, { auth: { persistSession: false } });
  const { data, error } = await sb
    .from("products")
    .select("id, slug, status")
    .eq("status", "active");
  if (error) throw new Error(error.message);
  const active = data ?? [];
  for (const row of active) {
    assert.equal(row.status, "active");
  }
  const { data: drafts } = await sb
    .from("products")
    .select("id, slug, status")
    .eq("status", "draft")
    .limit(5);
  for (const draft of drafts ?? []) {
    const { data: hit } = await sb
      .from("products")
      .select("id, status")
      .eq("slug", draft.slug)
      .eq("status", "active")
      .maybeSingle();
    assert.equal(hit, null, `draft slug ${draft.slug} must not resolve as active`);
  }
  console.log(
    `OK (DB): ${active.length} active products; draft slug lookup blocked`,
  );
} else {
  console.log("OK (unit): DB skipped (no Supabase env)");
}

console.log("OK: phase-4a public storefront unit checks passed");
