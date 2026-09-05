/**
 * Technical Token Protection (iCode spec section 6).
 *
 * Before sending text to EjoChat, detect and protect technical tokens:
 * file paths, URLs, code blocks, inline code, commands, package names,
 * identifiers, env vars, error messages, stack traces. Placeholders are used
 * internally and restored afterwards so language processing never corrupts
 * technical content.
 */

interface ProtectedToken {
  placeholder: string
  value: string
  id: string
}

export class TokenProtector {
  private tokens: ProtectedToken[] = []

  protect(text: string): string {
    this.tokens = []
    let out = text
    out = this.protectCodeBlocks(out)
    out = this.protectEnvVars(out)
    out = this.protectCommands(out)
    out = this.protectUrls(out)
    out = this.protectFilePaths(out)
    out = this.protectErrorShapes(out)
    out = this.protectInlineCode(out)
    return out
  }

  restore(text: string): string {
    let out = text
    for (const token of this.tokens) {
      out = out.split(token.placeholder).join(token.value)
    }
    for (const token of this.tokens) {
      out = out.replace(new RegExp(`\\b${token.id}\\b`, "g"), token.value)
    }
    return out
  }

  private capture(value: string): string {
    const id = `TOK${this.tokens.length}`
    const placeholder = `__${id}__`
    this.tokens.push({ placeholder, value, id })
    return placeholder
  }

  private protectCodeBlocks(text: string): string {
    return text.replace(/```[\s\S]*?```|`[^`\n]{1,200}`/g, (m) => this.capture(m))
  }

  private protectEnvVars(text: string): string {
    return text.replace(/\b[A-Z][A-Z0-9_]{2,}\b/g, (m) => {
      if (/^(EJOCHAT_API_KEY|API_KEY|SECRET|TOKEN|PASSWORD|PASSWD|AWS_ACCESS_KEY|PRIVATE_KEY)$/i.test(m)) {
        return this.capture(m)
      }
      return m
    })
  }

  private protectCommands(text: string): string {
    return text.replace(
      /\b(?:npx|npm|bun|node|git|yarn|pnpm|pip|go|rustc|cargo|docker|kubectl|curl|wget|ssh|ls|cd|cat|rg|grep|find|rm|cp|mv|touch|mkdir|make|cargo)\s+-?[^\s\u0000]{0,200}\b/g,
      (m) => this.capture(m),
    )
  }

  private protectUrls(text: string): string {
    return text.replace(/\bhttps?:\/\/[^\s\u0000"'\u3011]+/gi, (m) => this.capture(m))
  }

  private protectFilePaths(text: string): string {
    return text.replace(
      /(?:[~.]\/)?[\w.@-]+(?:\/[\w.@-]+)*\/[\w.@-]+\.(?:ts|tsx|js|jsx|py|json|jsonc|toml|yaml|yml|md|rs|go|c|h|cpp|hpp|java|rb|php|sh|css|html|txt|lock|mod|sum|config|env|map|db|sqlite|sql|csv|log)(?:\.\w+)?/g,
      (m) => this.capture(m),
    )
  }

  private protectErrorShapes(text: string): string {
    return text.replace(
      /(?:^|[\n ])(?:Error|TypeError|ReferenceError|SyntaxError|RangeError|PermissionError|ENOENT|EACCES|EADDRINUSE|ModuleNotFoundError|ImportError|failed|FATAL|panic)[^\n]{0,160}/g,
      (m) => this.capture(m.trim()),
    )
  }

  private protectInlineCode(text: string): string {
    return text.replace(/\b[A-Za-z_$][\w$]*(?:\.\w+)*\([^)\n]{0,80}\)\b/g, (m) => this.capture(m))
  }
}

export function protectTokens(text: string): { text: string; restore: (out: string) => string } {
  const p = new TokenProtector()
  const text2 = p.protect(text)
  return { text: text2, restore: (out) => p.restore(out) }
}

const ENTROPY_MIN = 3.2

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

export function isLikelySecret(value: string): boolean {
  if (value.length < 8) return false
  if (/^(sk|pk|ghp|gho|ghu|ghs|xox[baprs]-|AKIA[0-9A-Z]{16}|ejochat_)\S+/i.test(value)) return true
  if (/\b(api[_-]?key|secret|token|password|passwd|credential)\b\s*[:=]\s*\S+/i.test(value)) return true
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

export function redactEnvSecrets(text: string, env: NodeJS.ProcessEnv): string {
  let out = text
  for (const value of Object.values(env)) {
    if (!value || value.length < 8) continue
    if (!isLikelySecret(value)) continue
    out = out.split(value).join("***")
  }
  return out
}