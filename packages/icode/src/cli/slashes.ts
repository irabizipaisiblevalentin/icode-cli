import type { LanguageMode } from "../config"

export type SlashName =
  | "help"
  | "status"
  | "model"
  | "config"
  | "clear"
  | "exit"
  | "version"

export interface SlashCommand {
  name: SlashName
  /** Description shown in /help (spec section 9). */
  description: string
  /** Optional arguments. */
  args?: string[]
}

export const SLASH_COMMANDS: SlashCommand[] = [
  { name: "help", description: "Show all iCode commands." },
  { name: "status", description: "Show the status of the project." },
  { name: "model", description: "Show the model in use." },
  { name: "config", description: "Show where iCode stores its config." },
  { name: "clear", description: "Clear the terminal." },
  { name: "exit", description: "Exit iCode." },
  { name: "version", description: "Show the iCode version." },
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
  return arg === "en"
}

export function languageLabel(mode: LanguageMode): string {
  return "English"
}
