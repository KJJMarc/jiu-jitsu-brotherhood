import assert from "node:assert/strict";
import {
  hasNonMarcAboutAuthor,
  shouldAttachMarcBartonBio,
  stripAboutAuthorSection,
} from "../lib/content/author-bio";
import {
  extractYoutubeIdsFromHtml,
  sanitizeContentHtml,
  splitContentHtmlForRender,
} from "../lib/content/sanitize";
import {
  shouldSkipUnchanged,
  simpleChecksum,
  transformInternalLinks,
  transformShopifyHtml,
} from "../lib/content/import/transforms";
import {
  defaultCanonicalPath,
  isValidCanonicalPath,
  normalizeCanonicalPath,
} from "../lib/content/paths";
import { assessJjbSupabaseProject } from "../lib/supabase/jjb-project";
import { JJB_LEGAL_ENTITY } from "../lib/legal-entity";
import {
  contentTokenOrFilter,
  isMarcBartonSearchQuery,
  tokenizeSearchQuery,
} from "../lib/content/search";

// --- Paths / canonical ---
assert.equal(
  defaultCanonicalPath({ type: "article", handle: "foo" }),
  "/blogs/blog/foo",
);
assert.equal(
  defaultCanonicalPath({ type: "technique", handle: "bar" }),
  "/blogs/techniques/bar",
);
assert.equal(
  defaultCanonicalPath({
    type: "past_event",
    handle: "summer-seaside-special",
    blog_handle: "blog",
  }),
  "/blogs/blog/summer-seaside-special",
);
assert.equal(
  defaultCanonicalPath({ type: "page", handle: "about" }),
  "/pages/about",
);
assert.equal(normalizeCanonicalPath("/blogs/blog/foo/"), "/blogs/blog/foo");
assert.ok(isValidCanonicalPath("/pages/past-events"));
assert.ok(isValidCanonicalPath("/pages/progression-the-belt-system"));
assert.equal(isValidCanonicalPath("/Pages/Nope"), false);

// Articles may keep a /pages/… canonical (belt system) while type remains article.
assert.equal(
  defaultCanonicalPath({ type: "article", handle: "progression-the-belt-system" }),
  "/blogs/blog/progression-the-belt-system",
);

// --- Sanitisation ---
const dirty = `
<p onclick="alert(1)">Hello <script>evil()</script>world</p>
<iframe src="https://www.youtube.com/embed/bmtZrIzxKPc" width="560" height="315"></iframe>
<iframe src="https://evil.example/embed"></iframe>
<a href="javascript:alert(1)">bad</a>
<a href="/blogs/blog/safe">ok</a>
<img src="https://cdn.shopify.com/s/files/x.png" alt="gi" onerror="alert(1)">
<p data-mce-fragment="1">Keep prose intact.</p>
`;

const cleaned = sanitizeContentHtml(dirty);
assert.ok(!cleaned.html.includes("<script"));
assert.ok(!cleaned.html.includes("onclick"));
assert.ok(!cleaned.html.includes("javascript:"));
assert.ok(!cleaned.html.includes("onerror"));
assert.ok(!cleaned.html.includes("evil.example"));
assert.ok(cleaned.html.includes("Keep prose intact."));
assert.ok(cleaned.html.includes('data-jjb-youtube="bmtZrIzxKPc"'));
assert.deepEqual(cleaned.youtubeIds, ["bmtZrIzxKPc"]);
assert.ok(cleaned.html.includes('href="/blogs/blog/safe"'));

const parts = splitContentHtmlForRender(cleaned.html);
assert.ok(parts.some((p) => p.type === "youtube" && p.id === "bmtZrIzxKPc"));

const withClubPromo = `
<p>Event recap stays.</p>
<div data-jjb-youtube="Jhy0NRNyT70" class="jjb-youtube"></div>
<div>--------------------------</div>
<div>You can learn more about the Jiu Jitsu Brotherhood Club Network <a href="/pages/jiu-jitsu-brotherhood-club-network">here</a>:</div>
<div><a href="/pages/jiu-jitsu-brotherhood-club-network"><img src="https://cdn.shopify.com/s/files/1/0363/5125/files/Screenshot_2022-10-17_at_10.11.10_480x480.png?v=1665997906" alt=""></a></div>
`;
const strippedPromo = sanitizeContentHtml(withClubPromo);
assert.ok(strippedPromo.html.includes("Event recap stays."));
assert.ok(!strippedPromo.html.includes("learn more about the Jiu Jitsu Brotherhood Club Network"));
assert.ok(!strippedPromo.html.includes("Screenshot_2022-10-17"));
assert.ok(!strippedPromo.html.includes("--------------------------"));
const renderParts = splitContentHtmlForRender(withClubPromo);
assert.ok(
  renderParts.every(
    (p) =>
      p.type === "youtube" ||
      (!p.html.includes("learn more about the Jiu Jitsu Brotherhood Club Network") &&
        !p.html.includes("Screenshot_2022-10-17")),
  ),
);

assert.deepEqual(
  extractYoutubeIdsFromHtml(
    '<iframe src="https://www.youtube.com/embed/abcdefghijk"></iframe>',
  ),
  ["abcdefghijk"],
);

// --- Link transforms ---
const links = transformInternalLinks(`
<a href="http://www.jiujitsubrotherhood.com/pages/about/">About</a>
<a href="https://store.jiujitsubrotherhood.com/products/x">Product</a>
<a href="http://www.jiujitsubrotherhood.com/wp-content/uploads/old.jpg">WP</a>
<a href="www.kingstonjiujitsu.com">bare</a>
`);
assert.ok(links.html.includes("https://www.jiujitsubrotherhood.com/pages/about"));
assert.ok(
  links.html.includes("https://www.jiujitsubrotherhood.com/products/x"),
);
assert.ok(links.events.some((e) => e.code === "HTTPS_WWW"));
assert.ok(links.events.some((e) => e.code === "STORE_HOST"));
assert.ok(links.events.some((e) => e.code === "WP_UPLOAD"));
assert.ok(links.events.some((e) => e.code === "BAD_HREF"));

// --- Marc Barton author bio helpers ---
const marcBody = `
<p>Article copy.</p>
<p><b>About the author</b></p>
<p><em>Marc Barton is a Brazilian Jiu Jitsu black belt, educator, and former doctor with a background in human physiology and medicine.</em></p>
<p><em>Now teaching…</em></p>
`;
assert.equal(
  stripAboutAuthorSection(marcBody).includes("About the author"),
  false,
);
assert.ok(stripAboutAuthorSection(marcBody).includes("Article copy."));

const tomBody = `
<p>Compete once.</p>
<h3><strong>About the author</strong></h3>
<p><i>This article was written by Tom Renshaw.</i></p>
`;
assert.equal(hasNonMarcAboutAuthor(tomBody), true);
assert.equal(
  shouldAttachMarcBartonBio({
    type: "article",
    source_shopify_author: "JJB Admin",
    body_html: tomBody,
  } as never),
  false,
);
assert.equal(
  shouldAttachMarcBartonBio({
    type: "article",
    source_shopify_author: "JJB Admin",
    body_html: "<p>No bio yet.</p>",
  } as never),
  false,
);
assert.equal(
  shouldAttachMarcBartonBio({
    type: "article",
    source_shopify_author: "Marc Barton",
    body_html: "<p>No bio yet.</p>",
  } as never),
  true,
);
assert.equal(
  shouldAttachMarcBartonBio({
    type: "article",
    source_shopify_author: "JJB Admin",
    body_html: marcBody,
  } as never),
  true,
);
assert.equal(
  shouldAttachMarcBartonBio({
    type: "technique",
    source_shopify_author: null,
    body_html: "<p>Technique.</p>",
  } as never),
  false,
);

// --- Content search helpers ---
assert.deepEqual(tokenizeSearchQuery("  marc   barton "), ["marc", "barton"]);
assert.equal(isMarcBartonSearchQuery(["marc", "barton"]), true);
assert.equal(isMarcBartonSearchQuery(["marc"]), true);
assert.equal(isMarcBartonSearchQuery(["tom", "renshaw"]), false);
assert.ok(contentTokenOrFilter("guard").includes('title.ilike."%guard%"'));

const full = transformShopifyHtml(
  '<p>Hi</p><iframe src="https://www.youtube.com/embed/bmtZrIzxKPc"></iframe>',
);
assert.ok(full.youtubeIds.includes("bmtZrIzxKPc"));
assert.ok(full.html.includes("data-jjb-youtube"));

// --- Idempotency ---
const checksum = simpleChecksum(full.html);
assert.equal(
  shouldSkipUnchanged({
    existingSourceUpdatedAt: "2024-01-01T00:00:00Z",
    incomingSourceUpdatedAt: "2024-01-01T00:00:00Z",
    existingBodyChecksum: checksum,
    incomingBodyChecksum: checksum,
  }),
  true,
);
assert.equal(
  shouldSkipUnchanged({
    existingSourceUpdatedAt: "2024-01-01T00:00:00Z",
    incomingSourceUpdatedAt: "2024-01-02T00:00:00Z",
    existingBodyChecksum: checksum,
    incomingBodyChecksum: checksum,
  }),
  false,
);

// --- No KJJ Supabase fallback when unconfigured ---
const safety = assessJjbSupabaseProject();
assert.equal(safety.ok, false);
assert.match(safety.reason, /Supabase|JJB_SUPABASE/i);

// --- Legal identity constant present ---
assert.equal(JJB_LEGAL_ENTITY.operatorLegalName, "Kingston Jiu Jitsu Ltd");
assert.equal(JJB_LEGAL_ENTITY.companyNumber, "11578178");
assert.ok(!/VAT|FastDD|PayPal/i.test(JSON.stringify(JJB_LEGAL_ENTITY)));

console.log("Phase 2E content foundation tests passed.");
