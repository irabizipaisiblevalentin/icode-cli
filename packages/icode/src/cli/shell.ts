import { loadConfig, apiKey, hasEjoChatKey, type ICodeConfig } from "../config"
import { createTheme, type Theme } from "./theme"
import { renderBox, success, error, warning, info, primary } from "./renderer"
import { terminalInfo } from "./terminal"
import { Spinner } from "./spinner"
import { promptLine } from "./prompt"
import { SLASH_COMMANDS, parseSlash, isLanguageArg, languageLabel, type SlashName } from "./slashes"
import { isDangerousCommand } from "./danger"
import { readProjectInfo } from "../agent/context"
import { runOpenCodePrompt, type AgentSignal } from "../agent/opencode-agent"
import { KinyarwandaService } from "../language/kinyarwanda-service"
import { detectLanguage, extractIntent } from "../language/detector"
import { redactSecrets } from "../security/secret"

const VERSION = "0.1.0"

interface Session {
  config: ICodeConfig
  theme: Theme
  kinyarwanda: KinyarwandaService
  directory: string
  history: string[]
  running: boolean
  abort?: AbortController
  lastResult?: string
}

export async function runCLI(argv = process.argv.slice(2)): Promise<void> {
  const config = loadConfig()
  const theme = createTheme()
  const directory = process.cwd()
  const kinyarwanda = new KinyarwandaService({ config, apiKey: apiKey(), env: process.env })

  const session: Session = {
    config,
    theme,
    kinyarwanda,
    directory,
    history: [],
    running: false,
  }

  const render = makeRender(session)

  // Flag: non-interactive single-shot mode like: icode "prompt"
  const inlinePrompt = argv.join(" ").trim()
  if (inlinePrompt) {
    await runInline(session, inlinePrompt)
    return
  }

  printBanner(session)
  if (!hasEjoChatKey()) {
    warning(render, "EjoChat ntabwo yashyizweho. Koresha EJOCHAT_API_KEY.")
  }
  info(render, "Koresha /help kugira ngo ubone amabwiriza.")

  let ok = true
  while (ok) {
    const { line, ctrlC } = await promptLine({ theme, prefix: `${theme.glyphs.primary} iCode > ` }, session.history)
    if (ctrlC) {
      if (session.running && session.abort) {
        session.abort.abort()
        ok = false
      }
      continue
    }
    const trimmed = line.trim()
    if (!trimmed) continue
    session.history.push(trimmed)
    ok = await dispatch(session, trimmed)
  }
  primary(render, "Muraho, murabeho! 👋")
}

async function runInline(session: Session, prompt: string): Promise<void> {
  await handlePrompt(session, prompt)
}

function makeRender(session: Session) {
  const t = terminalInfo(session.config)
  const width = Math.max(40, t.columns)
  const out = (text: string) => process.stdout.write(`${text}\n`)
  return { theme: session.theme, width, out }
}

function printBanner(session: Session): void {
  const render = makeRender(session)
  const { theme, width, out } = render
  const project = readProjectInfo(session.directory)

  renderBox(
    { theme, width, out },
    ` ${theme.paint("iCODE", "35")}${" ".repeat(Math.max(0, width - 12))}\n${" ".repeat(2)}Umufasha wo Kwandika Porogaramu${" ".repeat(Math.max(2, width - 34))}`,
    {},
  )
  out("")
  info(render, `Umushinga: ${theme.paint(project.name, "1")}`)
  info(render, `Dosiye: ${project.fileCount}`)
  info(render, `Git branch: ${theme.paint(project.branch, "32")}`)
  out("")
  out(`${theme.glyphs.primary} Muraho ${theme.glyphs.bullet} Niteguye kugufasha gukora kuri uyu mushinga.`)
  out("")
}

async function dispatch(session: Session, input: string): Promise<boolean> {
  const parsed = parseSlash(input)
  if (parsed) {
    if (parsed.name) return handleSlash(session, parsed.name, parsed.arg)
    renderBox(makeRender(session), `Ntiyabonetse: nta command ya "${input}". Koresha /help.`, { title: "Ikibazo", colorCode: "31" })
    return true
  }
  await handlePrompt(session, input)
  return true
}

async function handleSlash(session: Session, name: SlashName, arg: string | undefined): Promise<boolean> {
  const render = makeRender(session)
  switch (name) {
    case "help": {
      out(session, "Amabwiriza ya iCode:")
      for (const cmd of SLASH_COMMANDS) {
        const args = cmd.args ? ` ${cmd.args.join("|")}` : ""
        out(session, `  ${session.theme.paint(`/${cmd.name}${args}`, "36")} — ${cmd.description}`)
      }
      out(session, "")
      out(session, "iCode ni Irabizi Paisible Valentin.")
      return true
    }
    case "exit":
      return false
    case "clear":
      process.stdout.write("\u001b[2J\u001b[H")
      printBanner(session)
      return true
    case "version":
      info(render, `iCode version ${VERSION}`)
      info(render, "Created by Irabizi Paisible Valentin")
      return true
    case "status": {
      const project = readProjectInfo(session.directory)
      info(render, `Umushinga: ${project.name} (${project.fileCount} dosiye, branch: ${project.branch})`)
      info(render, `Ururimi: ${languageLabel(session.config.language)}`)
      info(render, `EjoChat: ${hasEjoChatKey() ? "yashyizweho" : "ntayo key"}`)
      info(render, `Model ya EjoChat: ${session.config.ejochatModel}`)
      return true
    }
    case "language": {
      if (!arg) {
        info(render, `Ururimi ruturikwa: ${languageLabel(session.config.language)}. Koresha /language rw|auto|en.`)
        return true
      }
      if (isLanguageArg(arg)) {
        session.config = { ...session.config, language: arg }
        info(render, `Ururimi rwahindutse: ${languageLabel(arg)}.`)
      } else {
        error(render, `Ururimi "rw", "auto" cyangwa "en" gusa.`)
      }
      return true
    }
    case "model":
      info(render, `Model ya EjoChat: ${session.config.ejochatModel}`)
      return true
    case "config":
      info(render, `Config: ~/.config/icode/config.{json,jsonc,toml,yaml}`)
      info(render, `EJOCHAT_BASE_URL: ${session.config.ejochatBaseUrl}`)
      return true
    default:
      return true
  }
}

function out(session: Session, text: string): void {
  process.stdout.write(`${text}\n`)
}

/**
 * Middleware pipeline (spec section 5):
 *   input -> detect -> Kinyarwanda understanding -> intent -> OpenCode agent ->
 *   technical result -> EjoChat Kinyarwanda explanation -> renderer.
 */
async function handlePrompt(session: Session, input: string): Promise<void> {
  const render = makeRender(session)
  const { theme, width } = render

  // Safety: confirm potentially destructive commands before execution (spec 10).
  if (isDangerousCommand(input) && session.config.confirmDangerous) {
    warning(render, "Iri tegeko rishobora guhindura cyangwa gusiba amakuru.")
    out(session, `  ${theme.paint(input, "1")}`)
    out(session, "")
    const { line } = await promptLine({ theme, prefix: "Urashaka gukomeza? [y/N] " })
    const answer = line.trim().toLowerCase()
    if (answer !== "y" && answer !== "yes") {
      info(render, "Byahagaritswe.")
      return
    }
  }

  // 1) Language detection + intent extraction.
  const language = detectLanguage(input, session.config.language)
  const intent = extractIntent(input)
  const isRw = language === "rw"

  // 2) Kinyarwanda understanding (EjoChat) for rw requests — never for code.
  const spinner = new Spinner({ theme, out: (t) => process.stdout.write(t) })
  if (isRw && session.config.language !== "en") {
    spinner.start("Ndimo gusobanukirwa no gusesengura icyifuzo cyawe...")
    const understanding = await session.kinyarwanda.understandKinyarwanda(input, JSON.stringify(intent))
    spinner.stop()
    if (understanding.source === "ejochat") {
      info(render, "Nsobanukiwe icyifuzo cyawe.")
    }
  }

  // 3) Send to OpenCode agent. Protect technical tokens only for the EjoChat explanation path;
  //    OpenCode receives the original (technical identifiers stay intact).
  spinner.start("Ndimo gukora...")
  session.running = true
  const abort = new AbortController()
  session.abort = abort

  const streaming = new StreamingWriter(render)
  const technical = await runOpenCodePrompt(input, {
    directory: session.directory,
    signal: abort.signal,
    onSignal: (signal) => onAgentSignal(session, signal, streaming, spinner),
  })
  session.running = false
  session.abort = undefined
  spinner.stop()
  streaming.flush()
  session.lastResult = technical

  // 4) Kinyarwanda explanation of the technical result (EjoChat language layer).
  if (isRw && session.config.language !== "en") {
    const explanation = await session.kinyarwanda.explainInKinyarwanda(technical, input)
    if (explanation) {
      renderBox({ theme, width, out: process.stdout.write.bind(process.stdout) }, explanation, { title: "Igisubizo", colorCode: "36" })
      out(session, "")
    }
  }

  success(render, "Byakozwe neza.")
}

function onAgentSignal(session: Session, signal: AgentSignal, streaming: StreamingWriter, spinner: Spinner): void {
  const render = makeRender(session)
  switch (signal.type) {
    case "status":
      spinner.update(signal.text)
      return
    case "text-delta":
      spinner.stop()
      streaming.write(signal.delta)
      return
    case "text":
      spinner.stop()
      streaming.write(`\n${signal.text}`)
      return
    case "tool-start":
      spinner.update(`Ndimo gukoresha: ${signal.tool}`)
      return
    case "tool-end":
      spinner.stop()
      info(render, `Byakozwe: ${signal.tool}`)
      return
    case "tool-error":
      spinner.stop()
      warning(render, `Ikibazo muri: ${signal.tool}`)
      return
    case "error":
      spinner.stop()
      handleFailure(session, signal.technical)
      return
    default:
      return
  }
}

function handleFailure(session: Session, technical: string): void {
  const render = makeRender(session)
  renderBox(
    { ...render, out: process.stdout.write.bind(process.stdout) },
    `Ntibyashobotse gukora icyifuzo cyawe.\n\nImpamvu: ${redactSecrets(technical.slice(0, 200))}\n\nReba niba amabwiriza cyangwa uburenganzira biriho neza.`,
    { title: "Ikibazo", colorCode: "31" },
  )
  out(session, "")
  if (session.config.debug) {
    error(render, `[debug] ${redactSecrets(technical)}`)
  }
}

/**
 * Minimal streaming writer: buffers text and flushes lines at terminal width
 * so output stays readable during long explanations (spec 11, 16).
 */
class StreamingWriter {
  private buffer = ""
  private visible = 0

  constructor(private readonly render: { theme: Theme; width: number; out: (t: string) => void }) {}

  write(text: string): void {
    this.buffer += text
    const tokenized = splitKeepNewlines(this.buffer)
    this.buffer = ""
    for (const token of tokenized) {
      if (token === "\n") {
        this.render.out("")
        this.visible = 0
        continue
      }
      this.visible += token.length
      this.render.out(token)
      if (this.visible >= this.render.width) {
        this.render.out("")
        this.visible = 0
      } else if (this.visible > 0 && token.endsWith(" ")) {
        this.render.out(" ")
      }
    }
  }

  flush(): void {
    if (this.visible > 0) this.render.out("")
    this.visible = 0
  }
}

function splitKeepNewlines(text: string): string[] {
  const parts: string[] = []
  let current = ""
  for (const ch of text) {
    if (ch === "\n") {
      if (current) parts.push(current)
      parts.push("\n")
      current = ""
    } else {
      current += ch
    }
  }
  if (current) parts.push(current)
  return parts
}
