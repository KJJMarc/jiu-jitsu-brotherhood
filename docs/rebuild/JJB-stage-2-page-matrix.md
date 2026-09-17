# Jiu Jitsu Brotherhood rebuild: Stage 2 page matrix

Approved 16 September 2026.

## Rebuild direction

Jiu Jitsu Brotherhood will be rebuilt as a content-led, standard website with a small UK shop attached. It will be a substantial redesign and reconfiguration rather than a recreation of Shopify. The visual language should feel related to Kingston Jiu Jitsu through similar typography, spacing and clean editorial presentation, while retaining JJB's black, white and red identity.

## Approved primary navigation

- Home
- Start Here
- Articles
- Techniques
- Brotherhood
  - About JJB
  - Philosophy
  - Club Network
  - Contact
- Shop

Legal pages will remain in the footer. The shop will be a secondary section rather than the organising principle of the site.

## Existing page decisions

| Existing page | Decision | Proposed destination | Treatment |
| --- | --- | --- | --- |
| Contact | Keep and rewrite | `/contact` | Rebuild as a simple contact page under Brotherhood. |
| Blog | Retire as a page | `/articles` | Permanent redirect to the new Articles index. |
| Check Your Email | Merge | Dynamic success state | Replace the standalone page with a reusable form confirmation. |
| Home (hidden) | Retire | `/` | Do not migrate its Shopify and buy-button code. The new homepage replaces it. |
| Special Discount for All Military Personnel | Retain as a future feature | `/military-discount` | Keep unpublished until the new shop supports eligibility and a 15% discount. Mollie will process the discounted final amount; the site will own the discount logic. |
| Thank You (Black Belt Blueprint) | Retire | 410 Gone | Digital downloads will not form part of the new shop. |
| Your Discount Coupon | Retire | 410 Gone | Remove the old MATLIFE10 campaign page. A future discount system must use a new validated checkout flow rather than reviving this URL. |
| Thank you! | Merge | Dynamic success state | Replace with the standard email confirmation flow. |
| Privacy Policy | Keep and rewrite | `/privacy` | Update for the new hosting, analytics, email and payment services. |
| Thank You For Your Purchase | Merge | Checkout success route | The new shop should generate this state from the order, not use a content page. |
| Terms and Conditions | Keep and rewrite | `/terms` | Separate general website terms from shop delivery and returns where helpful. |
| CLOSED: Jiu Jitsu Master Academy | Retire | 410 Gone | The course and its access arrangements are long closed. |
| Welsh Winter Special | Archive | `/events/archive/welsh-winter-special` | Preserve as a historical Club Network event, excluded from primary navigation. |
| Spring Super Seminar | Archive | `/events/archive/spring-super-seminar` | Preserve as a historical Club Network event, excluded from primary navigation. |
| Summer Seaside Special | Archive | `/events/archive/summer-seaside-special` | Preserve as a historical Club Network event, excluded from primary navigation. |
| BJJ in Kingston-Upon-Thames | Move off JJB | Kingston Jiu Jitsu website | Permanent redirect to the relevant KJJ page to avoid duplicated local content. |
| About | Keep and substantially rewrite | `/about` | Create the main JJB story, purpose and philosophy page. |
| Do not sell my personal information | Retire | `/privacy` | Fold any applicable privacy rights into the updated policy; no standalone CCPA page is needed for the planned UK site unless legal review says otherwise. |
| How to Suck Less at Jiu Jitsu | Keep and rebuild | `/start-here/how-to-suck-less` | Recreate the PageFly landing page natively as an evergreen lead magnet. |
| The Oliver Geddes Foundation | Keep and refresh | `/oliver-geddes-foundation` | Retain a respectful overview and link prominently to the Foundation's official site. |
| The Beginner's Guide to BJJ | Keep and rebuild | `/start-here/beginners-guide` | Recreate natively as the main beginner entry point and lead magnet. |
| Jiu Jitsu Brotherhood Club Network | Keep and substantially rewrite | `/club-network` | Make this the definitive explanation of the network, benefits and participating clubs. |
| The BJJ Belt System: From White to Black | Reclassify as editorial content | `/articles/bjj-belt-system` | Preserve the strong evergreen content but remove it from the standalone-page system. |
| Thank You For Signing Up | Merge | Dynamic success state | Replace with the shared email confirmation flow. |
| Can't Find That... | Retire | System 404 page | Build a useful native 404 rather than migrating a Shopify content page. |
| CLOSED: BJJ Building Blocks and BJJ Learning Sites | Retire | 410 Gone | The sites, digital courses and access arrangements are long closed. |
| Disclaimer | Keep and rewrite | `/disclaimer` | Retain because the site contains physical training and health-related content. |
| Copyright Notice | Merge | `/terms` | Incorporate into the updated terms and use a concise copyright notice in the footer. |
| Jiu Jitsu Training Secrets (hidden) | Retire | `/start-here` | The offer will not remain active; redirect visitors to the two retained free resources. |
| Oli Geddes Foundation Charity Event | Archive | `/events/archive/oli-geddes-foundation-charity-event` | Preserve a respectful record of the May 2026 event and link it to the Foundation page. |

## Resulting core page set

The rebuild should need roughly these permanent standalone pages:

1. Home
2. Start Here
3. Beginner's Guide
4. How to Suck Less at Jiu Jitsu
5. About
6. Philosophy
7. Club Network
8. Past Events archive
9. Contact
10. Oliver Geddes Foundation
11. Military Discount, held unpublished until the feature is implemented
12. Privacy
13. Terms
14. Disclaimer

Articles, techniques, shop products and shop categories will be generated from their content systems rather than managed as standalone pages.

## Confirmed operational decisions

1. Reinstate the 15% military discount in future, but do not publish it until discount support is implemented.
2. Retain The Beginner's Guide to BJJ and How to Suck Less at Jiu Jitsu as the two email lead magnets.
3. Retire Jiu Jitsu Training Secrets.
4. Do not migrate any digital products, downloads or legacy course-access facilities.
5. Use the public shop only for physical products. Retain the four existing event-ticket product records privately as unpublished drafts; do not publish or convert them automatically.
6. Preserve past Club Network seminars in a low-profile Events archive.

## Next task

After these four operational points are confirmed, define the editorial taxonomy for 122 Articles and 60 Techniques. The existing Shopify tags should not be reused because they are dominated by product terms rather than useful learning categories.
