/** Lightweight config-file parsers: JSONC, simple TOML, simple YAML. */

export function stripCommentsAndParseJson(raw: string): unknown {
  let cleaned = raw
  cleaned = cleaned.replace(/^\s*\/\/.*$/gm, "")
  cleaned = cleaned.replace(/^\s*#.*$/gm, "")
  cleaned = cleaned.replace(/\/\*[\s\S]*?\*\//g, "")
  cleaned = cleaned.replace(/,\s*([}\]])/g, "$1")
  return JSON.parse(cleaned)
}

/** Parse a reasonable TOML subset: [section] tables, dotted keys, scalar values. */
export function parseSimpleToml(raw: string): Record<string, unknown> {
  const root: Record<string, unknown> = {}
  let current = root
  let currentKey = ""
  const sectionStack: Array<Record<string, unknown>> = [root]

  for (const line of raw.split("\n")) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue

    const table = /^\[([^\]]+)\]$/.exec(trimmed)
    if (table) {
      const path = table[1]!.trim().split(".")
      current = root
      for (const part of path) {
        const next = (current[part] ??= {} as Record<string, unknown>)
        current = next as Record<string, unknown>
      }
      sectionStack.push(current)
      currentKey = ""
      continue
    }

    const m = /^([^=]+)=([^#]+?)(?:\s*#.*)?$/.exec(trimmed)
    if (!m) continue
    const key = m[1]!.trim().replace(/^"|"$/g, "")
    const valueRaw = m[2]!.trim()
    currentKey = key
    current[key] = parseTomlValue(valueRaw)
    void currentKey
    void sectionStack
  }
  return root
}

function parseTomlValue(raw: string): unknown {
  const q = /^"([\s\S]*)"$/.exec(raw)
  if (q) return q[1]!.replace(/\\n/g, "\n").replace(/\\"/g, '"').replace(/\\\\/g, "\\")
  const sq = /^'([\s\S]*)'$/.exec(raw)
  if (sq) return sq[1]
  if (raw === "true") return true
  if (raw === "false") return false
  if (/^-?\d+$/.test(raw)) return Number(raw)
  if (/^-?\d+\.\d+$/.test(raw)) return Number(raw)
  if (/^\[.*\]$/.test(raw)) {
    const inner = raw.slice(1, -1).trim()
    if (!inner) return []
    return inner
      .split(",")
      .map((s) => s.trim())
      .map(parseTomlValue)
  }
  return raw
}

/** Parse a simple YAML subset: nested maps via indentation and scalar values. */
export function parseSimpleYaml(raw: string): Record<string, unknown> {
  const root: Record<string, unknown> = {}
  const stack: Array<Record<string, unknown>> = [root]
  const indents = [0]

  for (const line of raw.split("\n")) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue
    const indent = line.length - line.trimStart().length
    const m = /^([^:]+):(?:\s*(.*))?$/.exec(trimmed)
    if (!m) continue
    const [, keyRaw, valueRaw] = m
    const key = keyRaw!.trim().replace(/^"|"$/g, "")
    while (indent < indents[indents.length - 1]!) {
      stack.pop()
      indents.pop()
    }
    const current = stack[stack.length - 1]!
    if (valueRaw === undefined || valueRaw.trim() === "") {
      const child: Record<string, unknown> = {}
      current[key] = child
      stack.push(child)
      indents.push(indent)
    } else {
      current[key] = parseYamlScalar(valueRaw.trim())
    }
  }
  return root
}

function parseYamlScalar(raw: string): unknown {
  if (raw === "true") return true
  if (raw === "false") return false
  if (/^-?\d+$/.test(raw)) return Number(raw)
  const quoted = /^"([\s\S]*)"$/.exec(raw) ?? /^'([\s\S]*)'$/.exec(raw)
  if (quoted) return quoted[1]
  return raw
}
