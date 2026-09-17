/** @type {import('next').NextConfig} */

// Canonical production host. NOTE: the production domain is intentionally NOT
// configured/attached in this phase. These rules describe the intended
// behaviour for when kingstonjiujitsu.com is pointed at this deployment; they
// are scoped by host so they never fire on Vercel preview URLs or localhost.
const CANONICAL_HOST = "www.kingstonjiujitsu.com";
const APEX_HOST = "kingstonjiujitsu.com";
const TRIAL_URL = "https://www.dojodirector.com/kingston-jiu-jitsu/trial-enquiry";
// Existing external belt-ranking pages (kept on Dojo Director).
const ADULT_BELT_RANKINGS_URL = "https://www.dojodirector.com/adult-belt-rankings";
const JUNIOR_BELT_RANKINGS_URL =
  "https://www.dojodirector.com/kingston-jiu-jitsu-kids/junior-belt-rankings";

// Content-Security-Policy (report-only for now). Minimum sources needed for:
//  - local scripts/styles/fonts/images (Next self-hosts next/font + next/image)
//  - YouTube privacy-enhanced embeds (frame-src youtube-nocookie.com)
//  - Google Maps embeds (frame-src google.com)
//  - PayPal form submissions (form-action paypal.com)
//  - Consent-gated GA4 via gtag.js (script/connect/img only — Ads/remarketing
//    endpoints are omitted until those features are enabled)
// Dojo Director trial/booking/timetable are full-page links or server-side
// fetches, so they need no CSP allowance. 'unsafe-inline' is required for
// Next's inline bootstrap/hydration scripts and styled-jsx/inline styles.
// CSP allowlisting does not load GA4; TrackingScripts still mounts only after
// analytics (or marketing for AW-) consent.
const CSP_REPORT_ONLY = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  // Ignored in report-only browsers; clickjacking is covered by X-Frame-Options.
  "frame-ancestors 'none'",
  "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com",
  "style-src 'self' 'unsafe-inline'",
  // Admin YouTube thumbnails (i.ytimg.com) + Supabase Storage public URLs for article/product
  // images + Shopify CDN URLs for private catalogue import previews (admin-only).
  // GA4 may fall back to image beacons on some browsers.
  "img-src 'self' data: blob: https://i.ytimg.com https://*.supabase.co https://cdn.shopify.com https://www.google-analytics.com https://*.google-analytics.com https://www.googletagmanager.com",
  "font-src 'self'",
  // GA4 collect / measurement endpoints (official non-Ads set).
  "connect-src 'self' https://*.supabase.co https://www.google-analytics.com https://*.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com",
  "frame-src https://www.youtube-nocookie.com https://www.google.com",
  "form-action 'self' https://www.paypal.com",
].join("; ");

// Globally-applicable security headers. HSTS is intentionally omitted — Vercel
// supplies HTTPS/HSTS at the platform edge.
const SECURITY_HEADERS = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  // frame-ancestors 'none' (via CSP) is the modern control; X-Frame-Options is
  // a compatible fallback for older browsers.
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy-Report-Only", value: CSP_REPORT_ONLY },
];

function supabaseImageRemotePatterns() {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!raw) {
    return [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ];
  }
  try {
    const { hostname, protocol } = new URL(raw);
    return [
      {
        protocol: protocol.replace(":", "") || "https",
        hostname,
        pathname: "/storage/v1/object/public/**",
      },
    ];
  } catch {
    return [];
  }
}

const nextConfig = {
  reactStrictMode: true,
  // Preserve the WordPress trailing-slash URL behaviour.
  trailingSlash: true,
  poweredByHeader: false,

  // Product/article image uploads go through Server Actions. Next defaults to
  // 1MB which rejected many valid catalogue photos under the 5MB Storage limit.
  // Cap at 4.5MB to stay within Vercel's serverless request body limit.
  experimental: {
    serverActions: {
      bodySizeLimit: "4.5mb",
    },
  },

  images: {
    remotePatterns: supabaseImageRemotePatterns(),
  },

  async headers() {
    return [{ source: "/:path*", headers: SECURITY_HEADERS }];
  },

  async redirects() {
    return [
      // --- R1: host canonicalisation (apex -> www). Scoped to the real
      // production host so preview deployments are unaffected. ---
      {
        source: "/:path*",
        has: [{ type: "host", value: APEX_HOST }],
        destination: `https://${CANONICAL_HOST}/:path*`,
        permanent: true,
      },

      // --- R2: authoritative custom redirects (corrected targets) ---
      {
        source: "/category/events",
        destination: "/seminars-and-events/",
        permanent: true,
      },
      {
        source: "/category/news",
        destination: "/news/",
        permanent: true,
      },
      {
        source: "/category/adults_classes",
        destination: "/adult-classes/",
        permanent: true,
      },
      {
        source: "/category/kids_classes",
        destination: "/kids-classes/",
        permanent: true,
      },
      {
        source: "/book-a-class",
        destination: TRIAL_URL,
        permanent: true,
      },

      // --- R3: convenience redirects (from 404-log analysis) ---
      { source: "/contact-us", destination: "/contact/", permanent: true },
      { source: "/about-us", destination: "/about/", permanent: true },
      { source: "/blog", destination: "/news/", permanent: true },

      // --- R4: removed/renamed live pages -> closest equivalent (preserve SEO
      // and inbound links). Trailing-slash handling matches the rules above.
      // Matching is case-sensitive by design: the known historic/indexed URLs
      // use these lowercase forms — an intentional simplification, not a
      // reproduction of WordPress's case-insensitive URLs. ---
      {
        source: "/judo-for-bjj-classes",
        destination: "/tnt-takedowns-n-transitions/",
        permanent: true,
      },
      { source: "/yoga-classes", destination: "/classes/", permanent: true },
      { source: "/class-timetable", destination: "/timetable/", permanent: true },
      { source: "/zelim-tatarashvili", destination: "/instructors/", permanent: true },
      {
        source: "/adult-belt-rankings",
        destination: ADULT_BELT_RANKINGS_URL,
        permanent: true,
      },
      {
        source: "/junior-belt-rankings",
        destination: JUNIOR_BELT_RANKINGS_URL,
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
