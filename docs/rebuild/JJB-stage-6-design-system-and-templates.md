# Jiu Jitsu Brotherhood rebuild: Stage 6 design system and templates

Approved working specification, 16 September 2026.

## Design objective

Create a substantial upgrade from the Shopify site: a credible, content-led Jiu Jitsu publication and community website with a small UK physical-goods shop attached.

The site should feel related to Kingston Jiu Jitsu through its typographic clarity, generous spacing, clean cards and disciplined section rhythm. It must not look like another local academy website or a Shopify theme. JJB should feel broader, more editorial and more established.

The public hierarchy is:

1. Learn and explore Jiu Jitsu.
2. Understand the Brotherhood and its philosophy.
3. Find the Club Network and free resources.
4. Browse a deliberately small physical shop.

## Brand character

Use these qualities to judge every design decision:

- **Knowledgeable, not academic:** authoritative writing without institutional stiffness.
- **Experienced, not nostalgic:** honour JJB's history without making the site feel old.
- **Welcoming, not diluted:** useful to beginners while retaining credibility with experienced grapplers.
- **Confident, not aggressive:** avoid cages, flames, distressed type, combat clichés and tactical styling.
- **Human, not corporate:** show people, history, teaching and community.

## Visual relationship to KJJ

Borrow from the live Kingston Jiu Jitsu site:

- clear sans-serif typography;
- restrained card styling;
- short eyebrow labels above section headings;
- generous vertical spacing;
- strong photographic sections;
- calm, direct calls to action;
- consistent content widths and rounded corners.

Differentiate JJB by using a more magazine-like content layout, black/white/red identity, stronger long-form reading templates, less local-academy language and a deliberately secondary shop.

## Logo handling

- Do not redraw or auto-trace the logo during implementation.
- Build the header to accept a supplied horizontal SVG wordmark on desktop and a supplied circular serpent mark on mobile.
- Until final SVG assets are approved, use a clearly named placeholder component rather than embedding a raster logo into the layout.
- Keep the logo area free of taglines or additional badges.
- The circular mark must remain legible at 32 px and work as favicon and social avatar artwork.

## Design tokens

Tokens should be implemented as CSS custom properties and consumed by components rather than repeated as literal values.

### Colour

| Token | Suggested value | Use |
| --- | --- | --- |
| `--colour-ink` | `#111111` | Primary text, dark sections and header |
| `--colour-paper` | `#F7F5F1` | Main warm-white background |
| `--colour-white` | `#FFFFFF` | Cards and contrast surfaces |
| `--colour-red` | `#D51F2A` | Primary accent and active states |
| `--colour-red-dark` | `#A9151E` | Hover and dark-accent states |
| `--colour-stone` | `#E8E4DD` | Borders and quiet panels |
| `--colour-muted` | `#696764` | Secondary text |
| `--colour-success` | `#246B4A` | Confirmations and in-stock states |
| `--colour-warning` | `#9A5B13` | Low-stock and review states |

Red is an accent, not a background default. Most pages should be warm white with charcoal text, white content cards and occasional black editorial bands. Avoid a continuous black website and avoid red gradients.

### Typography

- Reuse the KJJ font family and weights if the existing project files are available and appropriately licensed.
- Fallback implementation: `Manrope` for headings and UI, `Source Sans 3` for body copy.
- Body text: 17 to 19 px on desktop, 16 to 18 px on mobile, line-height 1.65 to 1.75.
- Long-form content width: 680 to 760 px.
- Display headings use tight but readable tracking, never ultra-condensed lettering.
- Use sentence case. Reserve uppercase for short eyebrows, labels and small navigation controls.
- Do not centre long paragraphs.

### Spacing and geometry

| Token | Value |
| --- | --- |
| Content maximum | `1280px` |
| Reading maximum | `720px` |
| Narrow page maximum | `880px` |
| Desktop page gutter | `48px` |
| Tablet page gutter | `32px` |
| Mobile page gutter | `20px` |
| Standard section spacing | `96px` desktop, `64px` mobile |
| Compact section spacing | `64px` desktop, `44px` mobile |
| Card radius | `14px` |
| Button radius | `8px` |
| Fine border | `1px solid var(--colour-stone)` |

Shadows should be faint and used only when they clarify layering. Cards should rely primarily on borders, spacing and background contrast.

## Global shell

### Announcement bar

Optional and single-line on desktop. It may promote one current resource or UK shipping message. On mobile, wrap cleanly to two lines rather than shrinking the type. It must be dismissible and must not become a rotating carousel.

### Header

Desktop layout:

- horizontal wordmark at left;
- Home, Start Here, Articles, Techniques, Brotherhood and Shop;
- Brotherhood opens a simple accessible dropdown with About, Philosophy, Club Network and Contact;
- search icon and compact basket control at right;
- Shop is visually present but not more prominent than the learning sections.

Mobile layout:

- circular mark at left, search and basket controls, then menu button;
- full-height menu with visible section hierarchy;
- no hover-dependent interactions;
- body scroll locks while open, Escape closes, focus is trapped and returned to the trigger.

The header is sticky after the initial hero area, with a subtle border rather than a large shadow.

### Search

Search Articles and Techniques first, then pages and products. Results show type, title, excerpt and optional thumbnail. Drafts, event-ticket products and retired content must never appear.

### Footer

Use a dark footer with:

- concise JJB description and logo;
- Explore links: Start Here, Articles, Techniques, About and Philosophy;
- Brotherhood links: Club Network, Contact, Oliver Geddes Foundation and Past Events;
- Shop links: Shop, Shipping & Returns and Contact;
- legal links: Privacy, Terms and Disclaimer;
- email sign-up and social links;
- copyright line.

Do not include course access, member login, digital-download support or old Shopify account links.

## Reusable components

### Editorial components

- `PageHero`: eyebrow, title, standfirst and optional media.
- `ArticleCard`: image, category, title, excerpt, author and date.
- `ArticleCardFeatured`: larger image-led variant for one lead story.
- `TechniqueCard`: video thumbnail, duration where known, category, title and tags.
- `CategoryPill`: filter or metadata only; selected state must be unambiguous.
- `AuthorByline`: author image optional, name, credentials/role and publication dates.
- `ReadingProgress`: article pages only; unobtrusive and disabled for reduced motion.
- `RelatedContent`: manually curated first, category fallback second.
- `Callout`: note, safety, history or key takeaway variants.
- `PullQuote`: editorial emphasis, not decorative filler.
- `ShareLinks`: native share where supported plus copy-link; no intrusive floating rail on mobile.
- `TableOfContents`: generated from H2/H3 headings for sufficiently long articles; collapsible on mobile.

### Conversion components

- `ResourceCard`: cover image, short benefit statement and one action.
- `EmailCapture`: email, optional first name, explicit privacy text, loading/error/success states.
- `NewsletterBand`: reusable quiet full-width sign-up section.
- `ContactForm`: name, email, subject and message with spam protection and accessible validation.
- `PrimaryCTA` and `SecondaryCTA`: never show more than two competing actions in one block.

The two active free resources are The Beginner's Guide to BJJ and How to Suck Less at Jiu Jitsu. Do not add course-access or digital-download account interfaces.

### Shop components

- `ProductCard`: consistent image ratio, product name, GBP price and availability.
- `ProductGallery`: swipeable mobile gallery with thumbnails on larger screens.
- `VariantSelector`: sizes/options presented as clear buttons, with unavailable states disabled.
- `StockStatus`: in stock, low stock or unavailable; never expose provisional migration quantities.
- `AddToBasket`: validates selection and stock before opening a compact basket drawer.
- `BasketDrawer`: product, variant, quantity, subtotal and checkout action.
- `ShopCategoryCard`: one of the six approved categories only.
- `DeliveryNotice`: UK delivery scope and link to shipping policy.

Do not build public components for event-ticket products, subscriptions, customer accounts, course access, downloadable files or overseas checkout.

## Page templates

### 1. Home

The homepage should establish JJB as a place to learn, think and connect rather than as a shop.

Recommended order:

1. Editorial hero with a concise statement, supporting copy and two actions: `Start Here` and `Explore Articles`.
2. Three pathway cards: Start Here, Articles and Techniques.
3. Featured Article plus three recent Articles.
4. Featured Technique with video thumbnail and supporting Technique cards.
5. A dark Brotherhood story band introducing history, philosophy and the Club Network.
6. The two free-resource cards.
7. Curated category links for Articles and Techniques.
8. A compact shop strip showing no more than four selected physical products.
9. Newsletter band.

Do not use a hero slideshow, product-first grid, automatic carousel, testimonial wall or long opening paragraph over an image.

### 2. Start Here

Designed for new and returning practitioners who need orientation.

- welcoming hero;
- `New to Jiu Jitsu`, `Train Better` and `Stay Healthy` pathways;
- Beginner's Guide and How to Suck Less resource cards;
- curated essential Articles;
- curated foundational Techniques;
- glossary and belt-system links;
- academy-selection guidance;
- newsletter sign-up.

This is a curated gateway, not another chronological archive.

### 3. Lead-magnet landing page

One shared template with content variations for the two retained resources:

- resource cover or supporting artwork;
- direct benefit-led title and brief description;
- three to five contents/benefit points;
- short author credibility block;
- email form beside the offer on desktop and below it on mobile;
- privacy reassurance;
- inline success state with next-step links.

The form must not imply that a course account will be created.

### 4. Articles index

- compact hero and introduction;
- featured Article;
- category navigation using the seven approved editorial groupings, with Past Events separated from ordinary Articles;
- searchable, paginated card grid;
- newsletter insertion after an appropriate row;
- no infinite scroll.

Desktop grid uses three columns; tablet two; mobile one. Pagination must produce crawlable URLs.

### 5. Article detail

- breadcrumb;
- category, title, standfirst, byline and dates;
- wide lead image with caption/credit where present;
- accessible long-form typography;
- optional table of contents;
- structured callouts, media and pull quotes;
- contextual links to relevant Techniques;
- author block;
- related Articles;
- one restrained newsletter or resource CTA.

Health-related content includes the Disclaimer link and a concise contextual notice where warranted. Do not present medical information as personalised advice.

### 6. Techniques index

- compact hero explaining the library;
- category filters: Fundamentals, Takedowns, Guard, Passing, Control, Submissions and Escapes;
- optional tags such as Gi, No-Gi, position and instructor;
- searchable, paginated Technique grid;
- no category named `Guards & Sweeps`.

### 7. Technique detail

- breadcrumb and category;
- title, short context and instructor attribution;
- responsive video or media first;
- written explanation below, preserving migrated text;
- tags for position, system, Gi/No-Gi and instructor;
- relevant safety note for leg locks, throws or self-defence where appropriate;
- previous/next items within a coherent series when available;
- related Techniques and relevant Articles.

The unpublished Heel Hook Details record remains inaccessible and excluded from search and sitemaps.

### 8. Category archive

Shared component system for Article and Technique categories, but with different card types. Include title, short editorial description, item count, filters where useful and crawlable pagination. Category descriptions must be editable rather than hard-coded.

### 9. About and Philosophy

Use editorial story pages rather than generic corporate layouts.

About should include:

- JJB's origin and development;
- Marc's role and relevant background;
- influential teachers and collaborators;
- milestones and selected archival photography;
- links into Philosophy and Club Network.

Philosophy should articulate open-source learning, community, curiosity, mutual development and the broader role of Jiu Jitsu. Use short principles or statements, but avoid turning the page into slogans alone.

### 10. Club Network

- explain what the network is and is not;
- benefits and expectations;
- current clubs in an accessible list or cards;
- map only if accurate coordinates and maintenance are available;
- enquiry call to action;
- link to the low-profile Past Events archive.

Do not imply franchising, accreditation or benefits that no longer exist.

### 11. Past Events

The archive is editorial and deliberately secondary:

- simple chronological index;
- event detail with date, location, photographs and historical copy where available;
- no buy button, availability state or ticket-product relationship;
- excluded from main navigation but linked from Club Network and footer.

The four retained event-ticket product drafts are not automatically represented here.

### 12. Shop index and category

- brief shop introduction and UK-delivery notice;
- six approved category cards;
- selected products or complete physical catalogue beneath;
- simple sort and category filters only when useful;
- no oversized promotional hero or discount pop-up.

The shop should feel like a small part of JJB, not a separate visual system.

### 13. Product detail

- gallery, name, price, options, stock state and add-to-basket control;
- concise delivery and returns summary;
- product description and relevant story/content beneath;
- related products from the same approved category;
- Product and Breadcrumb structured data.

The blue Ensō 4.0 remains an unpublished zero-stock draft until deliberately released. Draft products produce no public template output.

### 14. Contact

- concise introduction;
- contact form;
- direct email option;
- reason-for-contact selector if it improves routing: general, Club Network, shop/order, editorial;
- response expectation without promising an unsupported time.

### 15. Policy pages

Use a narrow reading column, table of contents for long policies, visible last-updated date and clear contact details. Avoid decorative hero images.

### 16. 404 and 410

- `404`: helpful search, Start Here, Articles and Techniques links; wording should allow for unpublished or mistyped URLs.
- `410`: clearly state that the retired item is no longer available, without pretending there is an equivalent. Offer Start Here and site search as optional next steps.
- Neither template should automatically redirect.

## Responsive behaviour

- Design at 360 px first, then validate 390, 768, 1024, 1280 and 1440 px widths.
- No horizontal overflow at 320 px.
- Images use explicit aspect ratios to prevent layout shift.
- Cards do not force equal heights when this creates large empty areas on mobile.
- Touch targets are at least 44 by 44 px.
- Filters collapse into an accessible disclosure or sheet on mobile.
- Tables scroll within their own container and retain visible headers where practical.
- Embedded video maintains 16:9 and never exceeds the content container.

## Accessibility and performance

- Target WCAG 2.2 AA.
- One H1 per page with logical heading order.
- Full keyboard operation and visible focus states.
- Colour is never the only way to communicate selection, stock or error state.
- Respect `prefers-reduced-motion`; avoid scroll-jacking and parallax.
- Use responsive images, modern formats, lazy loading below the fold and priority only for true hero media.
- Load fonts locally where licensing permits, with limited weights and `font-display: swap`.
- Avoid large client-side animation libraries.
- Target Core Web Vitals: LCP below 2.5 s, CLS below 0.1 and INP below 200 ms at the 75th percentile.

## CMS and component contracts

Components must consume structured content rather than parse visual HTML conventions. At minimum:

- Article: title, slug, standfirst, body, primary category, tags, author, publish date, modified date, lead image, SEO and related-content IDs.
- Technique: title, slug, summary, body, video/media, primary category, tags, instructor, status, publish date, SEO and related-content IDs.
- Page: title, slug, page type, modular sections, status and SEO.
- Product: title, slug, description, category, variants, images, GBP price, stock status, shipping flag, status and SEO.
- Event archive: title, slug, dates, location, body, images and status; no required product relationship.

Use shared schemas and typed component props. Draft content must be blocked at the data-query layer, not merely hidden with CSS.

## Cursor implementation order

1. Establish tokens, fonts, global shell, accessibility primitives and responsive containers.
2. Build fixture-driven Article and Technique cards plus their detail templates.
3. Build Home, Start Here and the two lead-magnet pages.
4. Build About, Philosophy, Club Network, Contact and Past Events.
5. Build the six-category physical shop and basket components.
6. Build policy, search, 404 and 410 templates.
7. Connect migrated content only after the templates pass responsive and accessibility checks.

Do not start by importing all legacy HTML into unfinished templates. Build and approve representative fixtures first: one long Article, one short Article, one video Technique, one image-heavy history Article, one multi-variant Product and one archive Event.

## Stage 6 acceptance criteria

- The homepage clearly prioritises learning and Brotherhood over commerce.
- Articles and Techniques have distinct indexes and detail experiences.
- The visual system feels related to KJJ without looking copied.
- The public site contains no account, course, download or event-ticket interfaces.
- The six approved shop categories are the only primary merchandise taxonomy.
- Mobile layouts work cleanly at 360 px.
- Every interactive component is keyboard accessible.
- Templates define loading, empty, error and success states.
- Draft content is excluded from public queries, search and sitemaps.

The next stage is Stage 7: technical architecture, content models and the Cursor build brief.
