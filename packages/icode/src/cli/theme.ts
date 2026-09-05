/**
 * Theme: semantic glyphs, box-drawing borders, and ANSI colors with
 * graceful ASCII + monochrome fallbacks (spec sections 1, 12, 16).
 */

export interface Glyphs {
  dialog: { tl: string; tr: string; bl: string; br: string; h: string; v: string }
  bullet: string
  success: string
  error: string
  warning: string
  info: string
  working: string
  primary: string
  arrow: string
  check: string
  cross: string
}

const UNICODE: Glyphs = {
  dialog: { tl: "╭", tr: "╮", bl: "╰", br: "╯", h: "─", v: "│" },
  bullet: "▸",
  success: "✓",
  error: "✗",
  warning: "⚠",
  info: "ℹ",
  working: "⠋",
  primary: "⚡",
  arrow: "→",
  check: "✓",
  cross: "✗",
}

const ASCII: Glyphs = {
  dialog: { tl: "+", tr: "+", bl: "+", br: "+", h: "-", v: "|" },
  bullet: ">",
  success: "OK",
  error: "ERR",
  warning: "!",
  info: "i",
  working: "*",
  primary: ">>",
  arrow: "->",
  check: "OK",
  cross: "ERR",
}

/** Detect whether the terminal supports Unicode nicely (no forced override). */
export function detectGlyphSupport(env: NodeJS.ProcessEnv = process.env): boolean {
  if (env.ICODE_ASCII === "1" || env.ICODE_ASCII === "true") return false
  if (env.NO_COLOR !== undefined) return true
  if (env.TERM === "dumb") return false
  const term = env.TERM ?? ""
  if (/dumb|linux|vt100|vt52|ansi$/.test(term)) return false
  return true
}

/** Whether colors should be emitted (spec: UI must stay readable in monochrome). */
export function detectColorSupport(env: NodeJS.ProcessEnv = process.env): boolean {
  if (env.NO_COLOR !== undefined) return false
  if (env.ICODE_NO_COLOR === "1" || env.ICODE_NO_COLOR === "true") return false
  if (env.TERM === "dumb") return false
  if (env.FORCE_COLOR !== undefined && env.FORCE_COLOR !== "0") return true
  const supported = typeof process !== "undefined" && process.stdout?.isTTY !== false
  return supported
}

export interface Theme {
  glyphs: Glyphs
  color: boolean
  /** ANSI wrap helper. */
  paint(text: string, codes: string): string
}

export function createTheme(env: NodeJS.ProcessEnv = process.env): Theme {
  const glyphs = detectGlyphSupport(env) ? UNICODE : ASCII
  const color = detectColorSupport(env)
  const paint = (text: string, codes: string) => {
    if (!color) return text
    return `\u001b[${codes}m${text}\u001b[0m`
  }
  return { glyphs, color, paint }
}

export function countAnsiLength(text: string): number {
  return text.replace(/\u001b\[[0-9;]*m/g, "").length
}

/** Wrap ANSI-colored text at a width without breaking escape codes. */
export function wrapAnsi(text: string, width: number): string {
  if (width <= 0) return text
  const lines: string[] = []
  const current: string[] = []
  let currentLen = 0
  const split = text.split(/(\u001b\[[0-9;]*m)/g)
  for (const part of split) {
    if (/^\u001b\[/.test(part)) {
      current.push(part)
      continue
    }
    for (const char of part) {
      current.push(char)
      currentLen++
      if (currentLen >= width) {
        lines.push(current.join(""))
        current.length = 0
        currentLen = 0
      }
    }
  }
  if (current.length > 0) lines.push(current.join(""))
  return lines.join("\n")
}
