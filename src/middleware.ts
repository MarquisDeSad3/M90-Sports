import { NextResponse, type NextRequest } from "next/server"

/**
 * Edge middleware. Two responsibilities:
 *
 *   1. Force `Cache-Control: private, no-store` on every admin response.
 *      Even though Next.js doesn't cache dynamic Server Component pages
 *      by default, this is defense in depth: any CDN or shared proxy
 *      placed in front of the app (e.g. Cloudflare) MUST NOT keep a
 *      page rendered for one logged-in admin and serve it to another
 *      user. `private` rules out shared caches; `no-store` rules out
 *      browser back/forward cache as well.
 *
 *   2. Same treatment for `/api/*` — server actions and API responses
 *      can carry user-specific data, never cache them.
 */
export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname
  const response = NextResponse.next()

  if (path.startsWith("/admin") || path.startsWith("/api")) {
    response.headers.set(
      "Cache-Control",
      "private, no-store, no-cache, must-revalidate, max-age=0",
    )
    response.headers.set("Pragma", "no-cache")
    response.headers.set("Expires", "0")
  }

  return response
}

export const config = {
  // Run on admin and api routes only — public pages keep their default
  // caching behavior.
  matcher: ["/admin/:path*", "/api/:path*"],
}
