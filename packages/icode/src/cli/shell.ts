import { loadConfig, redactEnvSecrets, type ICodeConfig } from "../config"
import { createTheme, type Theme } from "./theme"
import { renderBox, success, error, warning, info, primary } from "./renderer"
import { terminalInfo } from "./terminal"
import { Spinner } from "./spinner"
import { promptLine } from "./prompt"
import { SLASH_COMMANDS, parseSlash, languageLabel, type SlashName } from "./slashes"
import { isDangerousCommand } from "./danger"
import { readProjectInfo } from "../agent/context"
import { runOpenCodePrompt, type AgentSignal } from "../agent/opencode-agent"
import { redactSecrets } from "../security/secret"

const VERSION = "0.1.0"

interface Session {
  config: ICodeConfig
  theme: Theme
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

  const session: Session = {
    config,
    theme,
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
  info(render, "Use /help to see all commands.")

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
  primary(render, "Goodbye! 👋")
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
    ` ${theme.paint("iCODE", "35")}${" ".repeat(Math.max(0, width - 12))}\n${" ".repeat(2)}Software Coding Assistant${" ".repeat(Math.max(2, width - 34))}`,
    {},
  )
  out("")
  info(render, `Project: ${theme.paint(project.name, "1")}`)
  info(render, `Files: ${project.fileCount}`)
  info(render, `Git branch: ${theme.paint(project.branch, "32")}`)
  out("")
  out(`${theme.glyphs.primary} Hello ${theme.glyphs.bullet} I'm ready to help you work on this project.`)
  out("")
}

async function dispatch(session: Session, input: string): Promise<boolean> {
  const parsed = parseSlash(input)
  if (parsed) {
    if (parsed.name) return handleSlash(session, parsed.name, parsed.arg)
    renderBox(makeRender(session), `No such command: "${input}". Use /help.`, { title: "Error", colorCode: "31" })
    return true
  }
  await handlePrompt(session, input)
  return true
}

async function handleSlash(session: Session, name: SlashName, arg: string | undefined): Promise<boolean> {
  const render = makeRender(session)
  switch (name) {
    case "help": {
      out(session, "iCode commands:")
      for (const cmd of SLASH_COMMANDS) {
        const args = cmd.args ? ` ${cmd.args.join("|")}` : ""
        out(session, `  ${session.theme.paint(`/${cmd.name}${args}`, "36")} — ${cmd.description}`)
      }
      out(session, "")
      out(session, "iCode by Irabizi Paisible Valentin.")
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
      info(render, `Project: ${project.name} (${project.fileCount} files, branch: ${project.branch})`)
      info(render, `Language: ${languageLabel(session.config.language)}`)
      info(render, `Config: ~/.config/icode/config.{json,jsonc,toml,yaml}`)
      return true
    }
    case "model":
      info(render, "Uses your configured model via OpenCode.")
      return true
    case "config":
      info(render, `Config: ~/.config/icode/config.{json,jsonc,toml,yaml}`)
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
 *   input -> OpenCode agent -> technical result -> renderer.
 */
async function handlePrompt(session: Session, input: string): Promise<void> {
  const render = makeRender(session)
  const { theme, width } = render

  // Safety: confirm potentially destructive commands before execution (spec 10).
  if (isDangerousCommand(input) && session.config.confirmDangerous) {
    warning(render, "This command could modify or delete data.")
    out(session, `  ${theme.paint(input, "1")}`)
    out(session, "")
    const { line } = await promptLine({ theme, prefix: "Continue? [y/N] " })
    const answer = line.trim().toLowerCase()
    if (answer !== "y" && answer !== "yes") {
      info(render, "Cancelled.")
      return
    }
  }

  // Send to OpenCode agent.
  const spinner = new Spinner({ theme, out: (t) => process.stdout.write(t) })
  spinner.start("Working...")
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

  success(render, "Done.")
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
      spinner.update(`Using: ${signal.tool}`)
      return
    case "tool-end":
      spinner.stop()
      info(render, `Done: ${signal.tool}`)
      return
    case "tool-error":
      spinner.stop()
      warning(render, `Problem in: ${signal.tool}`)
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
    `Could not complete your request.\n\nReason: ${redactSecrets(technical.slice(0, 200))}\n\nCheck that the command and permissions are correct.`,
    { title: "Error", colorCode: "31" },
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