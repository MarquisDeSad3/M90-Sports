import type { NextConfig } from "next"

/**
 * Baseline security headers applied to every response.
 *
 * - HSTS: forces HTTPS for a year on this host. Coolify already issues
 *   the cert + redirects HTTP, so HSTS just locks it in for the browser.
 * - X-Frame-Options DENY: this site is never embedded; refusing iframes
 *   kills clickjacking outright.
 * - X-Content-Type-Options nosniff: stops MIME-sniff attacks on uploaded
 *   files served from this origin (we don't have any, but cheap to set).
 * - Referrer-Policy: don't leak full URLs to third parties on outbound nav.
 * - Permissions-Policy: revoke browser features we never use.
 * - CSP: report-only first because the codebase has Framer Motion + inline
 *   styles. Move to enforcing once we've verified no legit traffic trips it.
 */
const securityHeaders = [
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains; preload",
  },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: [
      "accelerometer=()",
      "autoplay=()",
      "camera=()",
      "geolocation=()",
      "gyroscope=()",
      "magnetometer=()",
      "microphone=()",
      "payment=()",
      "usb=()",
    ].join(", "),
  },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  // CORS lockdown for the API surface — see `headers()` below for the
  // route-specific overrides.
]

/** Tight CORS for the public API. Only this site may call /api/*. */
const apiCorsHeaders = [
  { key: "Access-Control-Allow-Origin", value: "https://m90-sports.com" },
  { key: "Access-Control-Allow-Methods", value: "POST, OPTIONS" },
  { key: "Access-Control-Allow-Headers", value: "Content-Type" },
  { key: "Access-Control-Max-Age", value: "86400" },
  { key: "Vary", value: "Origin" },
]

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.b-cdn.net" },
      { protocol: "https", hostname: "**.bunnycdn.com" },
      { protocol: "https", hostname: "base44.app" },
      { protocol: "https", hostname: "**.supabase.co" },
    ],
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion"],
  },
  poweredByHeader: false, // don't advertise Next.js to attackers
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      { source: "/api/:path*", headers: apiCorsHeaders },
    ]
  },
}

export default nextConfig
