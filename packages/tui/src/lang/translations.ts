import { createSignal } from "solid-js"
import type { LanguageMode } from "./config"

/**
 * iCode's Kinyarwanda-first UI strings. The dictionary defaults to natural
 * Kinyarwanda (the product identity); the /language command can switch the
 * whole surface to English. Technical terms, file paths, commands and code
 * are never translated — they stay exactly as the user or engine produced
 * them.
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
  greeting: "Muraho 👋 Ndi iCode. Niteguye kugufasha gukora kuri uyu mushinga.",
  bye: "Muraho, murabeho! 👋",
  docs: "Open docs",
  language: "Language",
  "language.current": "Language: {}",
  "language.updated": "Language set to {}",
  "language.argHint": "Use /language rw|en|auto",
  unsupported: "Invalid language. Use rw, en or auto.",
}

const rw: Record<TranslationKey, string> = {
  thinking: "Ndimo gutekereza",
  thought: "Ibitekerezo",
  working: "Ndimo gukora",
  completed: "Byarangiye",
  error: "Ikibazo",
  warning: "Iburira",
  cancel: "Hagarika",
  continue: "Komeza",
  exit: "Sohoka",
  help: "Ubufasha",
  "help.body": "Kanda {} kugira ngo ubone ibikorwa n'amabwiriza byose bihari muri iyi context.",
  "help.close": "Funga ubufasha",
  "help.ok": "yego",
  settings: "Igenamiterere",
  askAnything: "Baza icyo ushaka...",
  runACommand: "Koresha itegeko...",
  readingFile: "Ndimo gusoma dosiye...",
  loadedFile: "Yasomwe",
  searchingContent: "Ndimo gushakisha ibiri muri dosiye...",
  searchingWeb: "Ndimo gushakisha ku rubuga...",
  fetchingWeb: "Ndimo gutora ibintu kuri interineti...",
  writingCommand: "Ndimo kwandika itegeko...",
  findingFiles: "Ndimo gushakisha amadosiye...",
  preparingWrite: "Ndimo kwitegura kwandika...",
  preparingEdit: "Ndimo kwitegura guhindura...",
  preparingPatch: "Ndimo kwitegura patch...",
  updatingTodos: "Ndimo guhindura urutonde rw'ibikorwa...",
  delegating: "Ndimo kohereza akazi...",
  askingQuestions: "Ndimo kubaza ibibazo...",
  loadingSkill: "Ndimo gushyiramo ubumenyi...",
  runningIn: "Irimo gukora muri",
  wrote: "Byanditswe",
  copiedToClipboard: "Byafashwe ku rupapuro (clipboard)",
  loadingPlugins: "Ndimo gushyiramo plugins...",
  finishingStartup: "Ndimo gusoza gutangiza...",
  creatingWorkspace: "Ndimo gushyiraho places...",
  connectProvider: "Komeza icyo ushaka kugira ngo ukoze",
  noModel: "Nta model yatoranyijwe",
  greeting: "Muraho 👋 Ndi iCode. Niteguye kugufasha gukora kuri uyu mushinga.",
  bye: "Muraho, murabeho! 👋",
  docs: "Amabwiriza (docs)",
  language: "Ururimi",
  "language.current": "Ururimi: {}",
  "language.updated": "Ururimi rwahindutse: {}",
  "language.argHint": "Koresha /language rw|en|auto",
  unsupported: "Ururimi ntabwo ruzwi. Koresha rw, en cyangwa auto.",
}

const dictionaries: Record<LanguageMode, Record<TranslationKey, string>> = {
  rw,
  en,
  auto: rw,
}

const [language, setLanguage] = createSignal<LanguageMode>("rw")

export { language }

export function updateLanguage(mode: LanguageMode) {
  setLanguage(mode)
}

export function translate(key: TranslationKey, replace?: string): string {
  const dict = dictionaries[language()]
  let value = dict[key] ?? en[key] ?? key
  if (replace !== undefined) value = value.replace("{}", replace)
  return value
}

export { translate as t }