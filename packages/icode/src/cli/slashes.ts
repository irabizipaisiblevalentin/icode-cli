import type { LanguageMode } from "../config"

export type SlashName =
  | "help"
  | "status"
  | "model"
  | "language"
  | "config"
  | "clear"
  | "exit"
  | "version"

export interface SlashCommand {
  name: SlashName
  /** Kinyarwanda description shown in /help (spec section 9). */
  description: string
  /** Optional arguments, e.g. rw/auto/en for /language. */
  args?: string[]
}

export const SLASH_COMMANDS: SlashCommand[] = [
  { name: "help", description: "Erekana amabwiriza yose ya iCode." },
  { name: "status", description: "Erekana uko umushinga umeze." },
  { name: "model", description: "Reba wende muri model ikoreshwa." },
  { name: "language", description: "Hitamo ururimi: rw, auto cyangwa en.", args: ["rw", "auto", "en"] },
  { name: "config", description: "Reba ahantu iCode ibitswe config." },
  { name: "clear", description: "Siba ibyo bigaragara kuri terminal." },
  { name: "exit", description: "Sohoka muri iCode." },
  { name: "version", description: "Erekana version ya iCode." },
]

export function parseSlash(input: string): { name?: SlashName; arg?: string } | null {
  const trimmed = input.trim()
  if (!trimmed.startsWith("/")) return null
  const [raw, ...rest] = trimmed.split(/\s+/)
  const name = raw!.slice(1) as SlashName
  const arg = rest.join(" ")
  if (SLASH_COMMANDS.some((c) => c.name === name)) {
    return { name, arg }
  }
  return { name: undefined, arg }
}

export function isLanguageArg(arg: string): arg is LanguageMode {
  return arg === "rw" || arg === "auto" || arg === "en"
}

export function languageLabel(mode: LanguageMode): string {
  switch (mode) {
    case "rw":
      return "Kinyarwanda"
    case "en":
      return "English"
    case "auto":
      return "Auto (gutahura ururimi)"
  }
}
