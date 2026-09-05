/**
 * Technical Token Protection (spec section 6).
 *
 * Before sending text to EjoChat, detect and protect technical tokens:
 * file paths, URLs, code blocks, inline code, commands, package names,
 * identifiers, env vars, error messages, stack traces. Placeholders are used
 * internally and restored afterwards so language processing never corrupts
 * technical content.
 */

export interface ProtectedToken {
  placeholder: string
  value: string
  /** Bare id, e.g. TOK0, that survives even if the model strips the wrapper. */
  id: string
}

export class TokenProtector {
  private tokens: ProtectedToken[] = []

  /** Capture the original text, replacing technical content with placeholders. */
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

  /** Restore placeholders to their original values. Must pair with protect(). */
  restore(text: string): string {
    let out = text
    // 1) Exact match: the placeholder is intact (delimiters preserved).
    for (const token of this.tokens) {
      out = out.split(token.placeholder).join(token.value)
    }
    // 2) Loose match: a language model may strip the placeholder's wrapper and
    //    echo just the bare id (e.g. "TOK0"). Replace any surviving bare ids.
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

/** Convenience wrapper returning both the protected text and the restore fn. */
export function protectTokens(text: string): { text: string; restore: (out: string) => string } {
  const p = new TokenProtector()
  const text2 = p.protect(text)
  return { text: text2, restore: (out) => p.restore(out) }
}
