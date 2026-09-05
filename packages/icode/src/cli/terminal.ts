import type { ICodeConfig } from "../config"

export interface TerminalInfo {
  columns: number
  rows: number
  isTTY: boolean
}

/** Read terminal dimensions safely (falls back to config width). */
export function terminalInfo(config: Pick<ICodeConfig, "termWidth">): TerminalInfo {
  const columns = process.stdout?.columns || config.termWidth
  const rows = process.stdout?.rows || 24
  return { columns, rows, isTTY: process.stdout?.isTTY ?? false }
}

export interface ResizeListener {
  (columns: number): void
}

/** Wire SIGWINCH to notify on terminal resize and return an unsubscribe fn. */
export function onResize(listener: ResizeListener): () => void {
  const handler = () => {
    const w = process.stdout?.columns
    if (w) listener(w)
  }
  if (typeof process !== "undefined" && process.on) {
    process.on("SIGWINCH", handler)
  }
  return () => {
    if (typeof process !== "undefined" && process.off) {
      process.off("SIGWINCH", handler)
    }
  }
}
