/** @type {import('next').NextConfig} */

// Canonical production host. NOTE: the production domain is intentionally NOT
// configured/attached in this phase. These rules describe the intended
// behaviour for when jiujitsubrotherhood.com is pointed at this deployment; they
// are scoped by host so they never fire on Vercel preview URLs or localhost.
const CANONICAL_HOST = "www.jiujitsubrotherhood.com";
const APEX_HOST = "jiujitsubrotherhood.com";

// Content-Security-Policy (report-only for now). Minimum sources needed for:
//  - local scripts/styles/fonts/images (Next self-hosts next/font + next/image)
//  - YouTube privacy-enhanced embeds (frame-src youtube-nocookie.com)
//  - Google Maps embeds (frame-src google.com) — unused on the Phase 1 public
//    shell; left until Club Network mapping is decided
//  - PayPal form submissions on leftover legal page markup (form-action)
//  - MailerLite public webform POSTs for Free Stuff + homepage newsletter
//    (form-action static.mailerlite.com only — no universal ML script)
//  - Consent-gated GA4 via gtag.js (script/connect/img only — Ads/remarketing
//    endpoints are omitted until those features are enabled)
// 'unsafe-inline' is required for Next's inline bootstrap/hydration scripts
// and styled-jsx/inline styles. CSP allowlisting does not load GA4;
// TrackingScripts still mounts only after analytics (or marketing for AW-) consent.
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
  "form-action 'self' https://www.paypal.com https://static.mailerlite.com",
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
  // Live JJB Shopify canonicals omit the trailing slash (Phase 2A/2B).
  trailingSlash: false,
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
    remotePatterns: [
      ...supabaseImageRemotePatterns(),
      // Temporary prototype: genuine JJB photography still hosted on Shopify CDN
      // until media migrates to Supabase Storage.
      {
        protocol: "https",
        hostname: "cdn.shopify.com",
        pathname: "/s/files/**",
      },
    ],
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
      // Short legal aliases → preserved Shopify / existing public paths.
      {
        source: "/terms",
        destination: "/pages/terms-conditions",
        permanent: true,
      },
      {
        source: "/privacy",
        destination: "/pages/privacy-policy",
        permanent: true,
      },
      {
        source: "/cookies",
        destination: "/cookie-policy",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
