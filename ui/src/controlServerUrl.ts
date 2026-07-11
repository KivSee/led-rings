/**
 * Normalize a user-entered control server URL so `fetch(`${base}/api/...`)`
 * always resolves as an absolute URL: prepend http:// when the scheme is
 * missing (a bare "127.0.0.1:3080" would otherwise be fetched as a path
 * relative to the UI origin), default the port to 3080 (the control server's
 * CONTROL_SERVER_PORT default) when none is given, and strip trailing slashes
 * (a double slash in the path 404s against the control server's exact-match
 * routing).
 */
export function normalizeControlServerUrl(raw: string): string {
  const trimmed = raw.trim()
  if (!trimmed) return ''
  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `http://${trimmed}`
  try {
    const url = new URL(withScheme)
    if (!url.port) url.port = '3080'
    return url.toString().replace(/\/+$/, '')
  } catch {
    // Not parseable as a URL — keep the user's input so they can see and fix it
    return withScheme.replace(/\/+$/, '')
  }
}
