import "server-only"

/**
 * Extract the real client IP behind Coolify/Traefik. We trust the
 * proxy chain because the app is only reachable through it.
 *
 * Order: cf-connecting-ip → x-real-ip → first hop in x-forwarded-for.
 * Falls back to "0.0.0.0" if nothing is present (should not happen
 * in production but keeps the limiter from crashing in dev).
 */
export function getClientIp(req: Request): string {
  const h = req.headers
  const cf = h.get("cf-connecting-ip")
  if (cf) return cf.trim()
  const real = h.get("x-real-ip")
  if (real) return real.trim()
  const fwd = h.get("x-forwarded-for")
  if (fwd) return fwd.split(",")[0]!.trim()
  return "0.0.0.0"
}

/**
 * Loose check that *something* claiming to be a browser sent the
 * request. We don't fingerprint UAs, just refuse blank/extremely-short
 * ones (curl --silent without -A is the obvious cheap-bot signal).
 */
export function looksLikeBrowser(req: Request): boolean {
  const ua = req.headers.get("user-agent") ?? ""
  if (ua.length < 10) return false
  // Block obvious headless markers used by attack tooling defaults.
  if (/^(curl|wget|python-requests|httpie|axios|go-http-client)\b/i.test(ua))
    return false
  return true
}
