import { createSignal } from "solid-js"
import type { LanguageMode } from "./config"

/**
 * iCode's UI strings. iCode is an English-first product; technical terms, file
 * paths, commands and code are never translated — they stay exactly as the
 * user or engine produced them.
 */

export type TranslationKey =
  | "thinking"
  | "thought"
  | "working"
  | "completed"
  | "error"
  | "warning"
  | "cancel"
  | "continue"
  | "exit"
  | "help"
  | "help.body"
  | "help.close"
  | "help.ok"
  | "settings"
  | "askAnything"
  | "runACommand"
  | "readingFile"
  | "loadedFile"
  | "searchingContent"
  | "searchingWeb"
  | "fetchingWeb"
  | "writingCommand"
  | "findingFiles"
  | "preparingWrite"
  | "preparingEdit"
  | "preparingPatch"
  | "updatingTodos"
  | "delegating"
  | "askingQuestions"
  | "loadingSkill"
  | "runningIn"
  | "wrote"
  | "copiedToClipboard"
  | "loadingPlugins"
  | "finishingStartup"
  | "creatingWorkspace"
  | "connectProvider"
  | "noModel"
  | "greeting"
  | "bye"
  | "docs"
  | "language"
  | "language.current"
  | "language.updated"
  | "language.argHint"
  | "unsupported"

const en: Record<TranslationKey, string> = {
  thinking: "Thinking",
  thought: "Thought",
  working: "Working",
  completed: "Completed",
  error: "Error",
  warning: "Warning",
  cancel: "Cancel",
  continue: "Continue",
  exit: "Exit",
  help: "Help",
  "help.body": "Press {} to see all available actions and commands in any context.",
  "help.close": "Close help",
  "help.ok": "ok",
  settings: "Settings",
  askAnything: "Ask anything...",
  runACommand: "Run a command...",
  readingFile: "Reading file...",
  loadedFile: "Loaded",
  searchingContent: "Searching content...",
  searchingWeb: "Searching web...",
  fetchingWeb: "Fetching from the web...",
  writingCommand: "Writing command...",
  findingFiles: "Finding files...",
  preparingWrite: "Preparing write...",
  preparingEdit: "Preparing edit...",
  preparingPatch: "Preparing patch...",
  updatingTodos: "Updating todos...",
  delegating: "Delegating...",
  askingQuestions: "Asking questions...",
  loadingSkill: "Loading skill...",
  runningIn: "Running in",
  wrote: "Wrote",
  copiedToClipboard: "Copied to clipboard",
  loadingPlugins: "Loading plugins...",
  finishingStartup: "Finishing startup...",
  creatingWorkspace: "Creating workspace...",
  connectProvider: "Connect a provider to send prompts",
  noModel: "No model selected",
  greeting: "Hello 👋 I am iCode. I'm ready to help you work on this project.",
  bye: "Goodbye! 👋",
  docs: "Open docs",
  language: "Language",
  "language.current": "Language: {}",
  "language.updated": "Language set to {}",
  "language.argHint": "Language is set to English",
  unsupported: "Invalid language.",
}

const dictionaries: Partial<Record<LanguageMode, Record<TranslationKey, string>>> = {
  en,
}

const [language, setLanguage] = createSignal<LanguageMode>("en")

export { language }

export function updateLanguage(mode: LanguageMode) {
  setLanguage(mode)
}

export function translate(key: TranslationKey, replace?: string): string {
  const dict = dictionaries[language()]
  let value = dict?.[key] ?? en[key] ?? key
  if (replace !== undefined) value = value.replace("{}", replace)
  return value
}

export { translate as t }