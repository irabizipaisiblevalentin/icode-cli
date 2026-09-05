import type { Theme } from "./theme"
import { countAnsiLength } from "./theme"

export interface RenderOptions {
  theme: Theme
  width: number
  out: (text: string) => void
}

export interface BoxOptions {
  title?: string
  colorCode?: string
  padding?: number
}

/** Render a dialog-style box with an optional title (spec sections 1, 8). */
export function renderBox(render: RenderOptions, body: string, opts: BoxOptions = {}): void {
  const { theme, width, out } = render
  const { title, colorCode, padding = 1 } = opts
  const g = theme.glyphs
  const inner = Math.max(10, width - 2)
  const titleStr = title ? ` ${title} ` : ""

  const paintBorder = (text: string) => (colorCode && theme.color ? theme.paint(text, colorCode) : text)

  // Top border with optional centered or left title.
  let top = paintBorder(`${g.dialog.tl}${g.dialog.h.repeat(inner)}${g.dialog.tr}`)
  if (titleStr) {
    const t = paintBorder(` ${g.dialog.h}${titleStr}${g.dialog.h}`)
    const titleLen = countAnsiLength(t)
    const leftPad = Math.max(0, Math.floor((inner - titleLen + 2) / 2))
    top = paintBorder(`${g.dialog.tl}${g.dialog.h.repeat(leftPad)}${t}${g.dialog.h.repeat(Math.max(0, inner - leftPad - titleLen + 2))}${g.dialog.tr}`)
  }

  out(top)

  const pad = " ".repeat(padding)
  const bodyLines = String(body).split("\n")
  for (const line of bodyLines) {
    const contentLen = countAnsiLength(line)
    const rightPad = Math.max(0, inner - (contentLen + padding * 2))
    out(`${g.dialog.v}${pad}${line}${" ".repeat(rightPad)}${pad}${g.dialog.v}`)
  }

  out(paintBorder(`${g.dialog.bl}${g.dialog.h.repeat(inner)}${g.dialog.br}`))
}

export interface StatusOptions {
  colorCode?: string
}

/** One-line status: `<symbol> message` (spec section 12). */
export function status(render: RenderOptions, symbol: string, message: string, opts: StatusOptions = {}): void {
  const { theme, out } = render
  const sym = opts.colorCode && theme.color ? theme.paint(`${symbol}`, opts.colorCode) : symbol
  out(`${sym} ${message}`)
}

export function success(render: RenderOptions, message: string): void {
  status(render, render.theme.glyphs.success, message, { colorCode: "32" })
}

export function error(render: RenderOptions, message: string): void {
  status(render, render.theme.glyphs.error, message, { colorCode: "31" })
}

export function warning(render: RenderOptions, message: string): void {
  status(render, render.theme.glyphs.warning, message, { colorCode: "33" })
}

export function info(render: RenderOptions, message: string): void {
  status(render, render.theme.glyphs.info, message, { colorCode: "36" })
}

export function primary(render: RenderOptions, message: string): void {
  status(render, render.theme.glyphs.primary, message, { colorCode: "35" })
}
