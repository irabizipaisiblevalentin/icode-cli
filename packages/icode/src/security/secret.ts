/** Security helpers: secret detection and redaction. */

const ENTROPY_MIN = 3.2

/** Shannon entropy per char, a rough proxy for random-looking secrets. */
function entropy(value: string): number {
  if (value.length === 0) return 0
  const freq = new Map<string, number>()
  for (const ch of value) freq.set(ch, (freq.get(ch) ?? 0) + 1)
  let sum = 0
  for (const count of freq.values()) {
    const p = count / value.length
    sum -= p * Math.log2(p)
  }
  return sum
}

/**
 * True if a string looks like a secret: has a known secret prefix, is a long
 * high-entropy token, or matches common credential shapes. Used to redact them
 * from logs/UI.
 */
export function isLikelySecret(value: string): boolean {
  if (value.length < 8) return false
  if (/^(sk|pk|ghp|gho|ghu|ghs|xox[baprs]-|AKIA[0-9A-Z]{16})\S+/i.test(value)) return true
  if (/\b(api[_-]?key|secret|token|password|passwd|credential)\b\s*[:=]\s*\S+/i.test(value)) return true
  // High-entropy tokens that look like credentials: no spaces, mixed case/digits
  // and reasonably long. Sentences with spaces and common words are not secrets.
  if (
    value.length >= 20 &&
    !/\s/.test(value) &&
    /[A-Z-a-z]/.test(value) &&
    /[0-9]/.test(value) &&
    entropy(value) >= ENTROPY_MIN
  ) {
    return true
  }
  return false
}

const SECRET_LIKE_PATTERN =
  /\b(eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,})\b|"(?:api[-_]?key|secret|token|password)":\s*"[^"]{8,}"/g

/**
 * Redact obvious secret-shaped content (JWT, key fields, high-entropy tokens)
 * from arbitrary text before it reaches an external API or the UI/logs.
 */
export function redactSecrets(text: string): string {
  let out = text
  out = out.replace(SECRET_LIKE_PATTERN, (m, jwt) => {
    if (jwt) return "***JWT***"
    return '"***"'
  })
  out = out.replace(/\b([A-Za-z0-9+/_-]{32,})\b/g, (m) => {
    if (isLikelySecret(m)) return "***"
    return m
  })
  return out
}

/** Join text by scanning for any secret present in the provided secrets list. */
export function redactKnownSecrets(text: string, secrets: Iterable<string>): string {
  let out = text
  for (const s of secrets) {
    if (s && s.length >= 8 && out.includes(s)) out = out.split(s).join("***")
  }
  return out
}

/** Redact every secret-looking env value that appears inside the text. */
export function redactEnvSecrets(text: string, env: NodeJS.ProcessEnv): string {
  let out = text
  for (const value of Object.values(env)) {
    if (!value || value.length < 8) continue
    if (!isLikelySecret(value)) continue
    out = out.split(value).join("***")
  }
  return out
}

