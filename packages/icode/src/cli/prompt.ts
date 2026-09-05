import { createInterface } from "node:readline"
import type { Theme } from "./theme"

export interface PromptLineOptions {
  theme: Theme
  /** e.g. "⚡ iCode > " */
  prefix: string
}

export interface PromptLineResult {
  line: string
  ctrlC: boolean
}

/**
 * Read a single line from the terminal with history support (arrows).
 * Returns ctrlC=true when the user presses Ctrl-C (so the shell can decide
 * whether to clear the input or exit).
 */
export async function promptLine(options: PromptLineOptions, history: string[] = []): Promise<PromptLineResult> {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: process.stdin.isTTY ?? false,
    historySize: 100,
  })
  rl.setPrompt(options.theme.paint(options.prefix, "35"))
  if (history.length > 0) (rl as unknown as { history: string[] }).history = [...history]

  const line = await new Promise<string>((resolve) => {
    rl.prompt()
    rl.on("line", (l) => resolve(l))
    rl.on("close", () => resolve(""))
    rl.on("SIGINT", () => {
      rl.close()
      resolve("\u0003")
    })
  })

  return line === "\u0003" ? { line: "", ctrlC: true } : { line, ctrlC: false }
}
