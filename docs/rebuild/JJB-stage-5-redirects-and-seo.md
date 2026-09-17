# Jiu Jitsu Brotherhood rebuild: Stage 5 redirects and SEO

Approved working specification, 16 September 2026.

## Purpose

Preserve the authority of the existing JJB site while moving from Shopify's store-led URL structure to the new content-led site. Redirect only when the replacement satisfies the same intent. Do not send retired courses, downloads or unrelated legacy content to the home page.

## Canonical URL structure

| Content | Canonical pattern |
| --- | --- |
| Main pages | `/`, `/start-here`, `/about`, `/philosophy`, `/club-network`, `/contact` |
| Articles | `/articles/{slug}` |
| Techniques | `/techniques/{slug}` |
| Article categories | `/articles/category/{slug}` |
| Technique categories | `/techniques/category/{slug}` |
| Past-event editorial archive | `/events/archive/{slug}` |
| Shop landing page | `/shop` |
| Shop categories | `/shop/gis`, `/shop/rashguards`, `/shop/t-shirts-hoodies`, `/shop/grappling-gear`, `/shop/belts`, `/shop/patches` |
| Published physical products | `/shop/{slug}` |
| Policies | `/privacy`, `/terms`, `/shipping-returns`, `/disclaimer` |

Use lowercase URLs, hyphens, no trailing slash, HTTPS and `www.jiujitsubrotherhood.com` as the single canonical host. Preserve the approved existing content and product slugs unless this document gives an explicit replacement.

## Response rules

| Response | Use |
| --- | --- |
| `301` or `308` | A permanent, substantively equivalent destination exists |
| `404` | A URL is currently unavailable but may legitimately return, including unpublished drafts |
| `410` | The resource is intentionally and permanently retired with no equivalent replacement |

All redirects must be server-side, preserve useful query parameters, and resolve in one hop. Never redirect an error or retired URL to the home page merely to avoid a 404.

## Current Shopify content

### Articles and techniques

Generate these redirects from the exported 183 article records:

- `/blogs/blog/{slug}` to `/articles/{slug}` for every retained Article.
- `/blogs/techniques/{slug}` to `/techniques/{slug}` for every retained Technique.
- Preserve title, body, author, original publication date, updated date, image, alt text where present, excerpt and SEO fields.
- Exceptions: the editorial event records `summer-seaside-special` and `spring-super-seminar` go to `/events/archive/{slug}`.

The new site contains 122 Articles and 61 Techniques. No migrated record may be omitted or silently published under both old and new URLs.

### Shopify pages

| Existing URL | Treatment |
| --- | --- |
| `/pages/home` | `301` to `/` |
| `/pages/blog` | `301` to `/articles` |
| `/pages/about` | `301` to `/about` |
| `/pages/contact` | `301` to `/contact` |
| `/pages/jiu-jitsu-brotherhood-club-network` | `301` to `/club-network` |
| `/pages/privacy-policy` | `301` to `/privacy` |
| `/pages/ccpa-opt-out` | `301` to `/privacy` |
| `/pages/terms-conditions` | `301` to `/terms` |
| `/pages/copyright-notice` | `301` to `/terms` |
| `/pages/disclaimer` | `301` to `/disclaimer` |
| `/pages/beginners-guide-to-bjj-signup` | `301` to `/start-here/beginners-guide` |
| `/pages/how-to-suck-less-at-jiu-jitsu` | `301` to `/start-here/how-to-suck-less` |
| `/pages/progression-the-belt-system` | `301` to `/articles/bjj-belt-system` |
| `/pages/the-oliver-geddes-foundation` | `301` to `/oliver-geddes-foundation` |
| `/pages/bjj-in-kingston-upon-thames` | `301` to the canonical Kingston Jiu Jitsu website |
| `/pages/welsh-winter-special` | `301` to `/events/archive/welsh-winter-special` |
| `/pages/spring-super-seminar` | `301` to `/events/archive/spring-super-seminar` |
| `/pages/summer-seaside-special` | `301` to `/events/archive/summer-seaside-special` |
| `/pages/oli-geddes-foundation-charity-event-kingston-jiu-jitsu` | `301` to `/events/archive/oli-geddes-foundation-charity-event` |
| `/pages/armed-forces` | `404` while the future military discount is unpublished |
| `/pages/cant-find-that` | `410`; use the new global 404 template instead |
| `/pages/check-your-email`, `/pages/sign-up-thank-you`, `/pages/thank-you-1` | `410`; obsolete form-result pages |
| `/pages/thank-you-for-your-purchase`, `/pages/your-discount-coupon` | `410`; obsolete commerce-result pages |
| `/pages/thank-you`, `/pages/closed-jiu-jitsu-master-academy`, `/pages/closed-bjj-building-blocks-and-bjj-learning-sites`, `/pages/jiu-jitsu-training-secrets` | `410`; retired courses or digital access |

### Physical products

- Generate `/products/{slug}` to `/shop/{slug}` for the 26 retained physical products in Stage 4.
- The blue Ensō 4.0 Gi remains retained but unpublished with zero stock. Its product URL returns `404` until it is deliberately published; do not archive or remove the record.
- `/products/sticker-pack` redirects to `/shop/patches`.
- The other four discontinued zero-stock products return `410` if their URLs were ever public or have backlinks; otherwise no rule is required.

### Event-ticket product records

The following are admin drafts, not public archive content:

- `summer-super-seminar-2025`
- `2nd-summer-seaside-special-super-seminar`
- `jiu-jitsu-brotherhood-club-network-adults-competition`
- `kids-club-network-interclub-competition-2026`

Their product routes must return `404` while unpublished. Do not redirect them to Past Events, do not merge them into editorial archive records, and do not include them in any sitemap. The Kids Competition record must be changed from active to draft during import.

### Collections

| Shopify collection | Destination |
| --- | --- |
| `gis`, `enso-3-0` | `/shop/gis` |
| `rash-guards` | `/shop/rashguards` |
| `t-shirts`, `hoodies`, `apparel` | `/shop/t-shirts-hoodies` |
| `training-gear`, `shorts`, `spats`, `bags` | `/shop/grappling-gear` |
| `belts` | `/shop/belts` |
| `patches`, `stickers` | `/shop/patches` |
| `seminars` | `/events/archive` |
| Empty, person-specific, course or digital-download collections | `410` unless a manual review identifies a genuinely equivalent destination |

## Existing Shopify redirect ledger

The export contains 289 existing redirects. They have no duplicate sources, chains or loops in the source data. They break down as follows:

| Existing target type | Records | Resolution |
| --- | ---: | --- |
| Blog/article targets | 237 | 42 resolve to retained current content; flatten directly to the new Article, Technique or Event canonical URL. The other 195 are obsolete WordPress-era targets and default to `410` unless manual review finds an equivalent retained page. |
| Page targets | 44 | Resolve through the page-target table below. |
| Product targets | 6 | One retained belt product redirects to its shop URL; retired digital products return `410`; the Kids Competition product remains an unpublished draft and returns `404`. |
| Collection targets | 1 | `/collections/enso-3-0` resolves to `/shop/gis`. |
| External target | 1 | `/membership-access` returns `410` because it points to retired course access. |

Seven legacy sources contain query strings (`?page_id=...` or `?p=...`). Handle these in request middleware or edge routing before ordinary path matching; a framework redirect table that ignores the query is insufficient.

### Resolver precedence for all 289 records

1. Match the original source exactly, including the seven query-aware sources.
2. If its existing target is a retained Article or Technique handle, redirect straight to the new canonical URL.
3. If its target is a page, product or collection listed below, apply that explicit outcome.
4. If its target is an obsolete `/blogs/blog/{slug}` with no retained content record, return `410` by default.
5. A manual override may replace a `410` only when the destination answers substantially the same user intent.
6. Never preserve the intermediate Shopify target; the result must be one hop.

### Page targets used by the legacy redirects

| Legacy target(s) | Final outcome |
| --- | --- |
| `/pages/about`, `/pages/about__organisation`, `/pages/organisation`, `/pages/testimonials`, `/pages/support-us` | `301` to `/about` |
| `/pages/academies`, `/pages/jiu-jitsu-brotherhood-affiliation` | `301` to `/club-network` |
| `/pages/affiliate-disclosure`, `/pages/disclaimer` | `301` to `/disclaimer` |
| `/pages/beginners-guide-bjj`, `/pages/beginners-guide-bjj-2`, `/pages/beginners-guide-to-bjj` | `301` to `/start-here/beginners-guide` |
| `/pages/blog` | `301` to `/articles` |
| `/pages/brazilian-jiu-jitsu-seminars` | `301` to `/events/archive` |
| `/pages/contact`, `/pages/private-instruction` | `301` to `/contact` |
| `/pages/copyright-notice`, `/pages/terms-of-use` | `301` to `/terms` |
| `/pages/how-jiu-jitsu-works`, `/pages/newsletter`, `/pages/starting-brazilian-jiu-jitsu` and every `starting-brazilian-jiu-jitsu__*` target | `301` to `/start-here` |
| `/pages/no-bad-positions` | `301` to `/articles/no-bad-positions-in-jiu-jitsu` |
| `/pages/progression-the-belt-system`, `/pages/the-bjj-blue-belt-test-full` | `301` to `/articles/bjj-belt-system` |
| `/pages/privacy-policy` | `301` to `/privacy` |
| `/pages/shipping-and-returns-policy`, `/pages/shipping-and-returns-policy-pjj`, `/pages/shipping-returns-policy-2` | `301` to `/shipping-returns` |
| `/pages/bjj-in-kingston-upon-thames` | `301` to the canonical Kingston Jiu Jitsu website |
| `/pages/academic-draft`, `/pages/become-an-affiliate`, `/pages/black-belt-blueprint-giveaway-rules`, `/pages/cant-find-that`, `/pages/check-your-email`, `/pages/exclusive-video-detailed-triangle-choke-explanation`, `/pages/jiu-jitsu-masterclass`, `/pages/sign-up-thank-you`, `/pages/thank-you` | `410` |

### Product targets used by the legacy redirects

| Legacy target | Final outcome |
| --- | --- |
| `/products/journey-bjj-belt` | `301` to `/shop/journey-bjj-belt` |
| `/products/beyond-the-black-belt`, `/products/grapplers-longevity-vol-2-digital-download`, `/products/gundam`, `/products/half-guard-mastery` | `410` |
| `/products/kids-club-network-interclub-competition-2026` | `404` while the retained admin record is a draft |

## SEO implementation requirements

- Every indexable page has a unique title, meta description, canonical tag, Open Graph title, description and image.
- Preserve original Article and Technique publication dates. Use `dateModified` only for genuine editorial changes.
- Add valid `Article`, `Product`, `BreadcrumbList` and `Organization` structured data where appropriate; never mark draft or unavailable products as offers.
- Product structured data must reflect actual GBP price, availability and condition from the live catalogue.
- Generate the XML sitemap only from canonical `200` pages. Exclude redirects, 404s, 410s, drafts, checkout, order-result pages and internal search.
- Add article and product images to the relevant sitemap entries when supported.
- Use descriptive alt text and do not copy keyword-stuffed filenames into alt attributes.
- Paginated category pages use self-canonicals; do not canonicalize every page back to page one.
- Internal links must point directly to canonical URLs, never through redirects.
- Preserve meaningful backlinks by reviewing Search Console and analytics before launch. Promote a default `410` to a `301` only when a true equivalent exists.

## Launch validation

The rebuild cannot launch until all of these pass:

1. Generate a machine-readable redirect manifest from this specification and the exported `redirects.json`.
2. Confirm all 289 legacy sources have exactly one outcome: canonical destination, `404`, or `410`.
3. Test every current Article, Technique, Page, retained physical Product and non-empty Collection URL.
4. Test the seven query-string sources separately.
5. Crawl the preview site and confirm there are no redirect chains, loops, mixed-protocol canonicals, broken internal links or sitemap URLs returning anything other than `200`.
6. Confirm the four event-ticket products and blue Ensō draft are absent from navigation, shop listings and sitemaps.
7. Validate structured data on representative Article, Technique, Product, category and organization pages.
8. Submit the new sitemap in Google Search Console after launch and monitor crawl errors, indexed pages and high-value 404s weekly for the first six weeks.

## Stage 5 completion decision

The redirect policy is now deterministic: retain authority where equivalent content exists, keep draft catalogue records private, and retire obsolete digital/course URLs cleanly. The next rebuild stage is the component and template specification for implementation in Cursor.
