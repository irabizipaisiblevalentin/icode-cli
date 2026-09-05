import { Effect, Stream } from "effect"
import { AbsolutePath, Agent, Location, OpenCode, Prompt, Session } from "@opencode-ai/sdk-next"

/** Events the agent emits while running a prompt (consumed by the CLI renderer). */
export type AgentSignal =
  | { type: "status"; text: string }
  | { type: "text-delta"; delta: string }
  | { type: "text"; text: string }
  | { type: "tool-start"; tool: string }
  | { type: "tool-end"; tool: string }
  | { type: "tool-error"; tool: string }
  | { type: "done" }
  | { type: "error"; technical: string }

export interface OpenCodeAgentOptions {
  directory: string
  onSignal: (signal: AgentSignal) => void
  /** Signal to abort (Ctrl-C). */
  signal?: AbortSignal | null
}

/**
 * Drives OpenCode (the real coding engine) for a single prompt in the given
 * project directory. EjoChat is NOT involved here: this is the code/tool
 * execution layer (files, terminal, Git, code generation).
 */
export async function runOpenCodePrompt(prompt: string, options: OpenCodeAgentOptions): Promise<string> {
  const { directory, onSignal } = options

  const collected: string[] = []
  const toolNames = new Map<string, string>()

  const program = Effect.gen(function* () {
    const opencode = yield* OpenCode.create()

    const sessionID = Session.ID.make(`ses_icode_${crypto.randomUUID()}`)
    yield* opencode.sessions.create({
      id: sessionID,
      agent: Agent.ID.make("build"),
      location: Location.Ref.make({ directory: AbsolutePath.make(directory) }),
    })

    yield* opencode.sessions
      .events({ sessionID })
      .pipe(
        Stream.runForEach((event) => handleEvent(event, onSignal, collected, toolNames).pipe(Effect.asVoid)),
        Effect.forkScoped,
      )
    yield* opencode.sessions.prompt({
      sessionID,
      prompt: Prompt.make({ text: prompt }),
    })

    // Wait until the session is idle (no active provider work) then reload context.
    yield* opencode.sessions.wait({ sessionID })
    const context = yield* opencode.sessions.context({ sessionID })
    const text = extractFinalText(context)
    if (text) {
      collected.length = 0
      collected.push(text)
    }
    onSignal({ type: "done" })
  })

  try {
    await Effect.runPromise(Effect.scoped(program))
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    onSignal({ type: "error", technical: message })
    throw error
  }

  return collected.join("\n")
}

function handleEvent(
  event: import("@opencode-ai/sdk-next").OpenCodeEvent,
  onSignal: (signal: AgentSignal) => void,
  collected: string[],
  toolNames: Map<string, string>,
): Effect.Effect<void> {
  switch (event.type) {
    case "session.next.text.started":
      onSignal({ type: "status", text: "Ndimo kwandika igisubizo..." })
      return Effect.void
    case "session.next.text.delta":
      collected.push(event.data.delta)
      onSignal({ type: "text-delta", delta: event.data.delta })
      return Effect.void
    case "session.next.text.ended":
      collected.push(event.data.text)
      onSignal({ type: "text", text: event.data.text })
      return Effect.void
    case "session.next.tool.called":
      toolNames.set(event.data.callID, event.data.tool)
      onSignal({ type: "tool-start", tool: event.data.tool })
      return Effect.void
    case "session.next.tool.success":
      onSignal({ type: "tool-end", tool: toolName(toolNames, event.data.callID) })
      return Effect.void
    case "session.next.tool.failed":
      onSignal({ type: "tool-error", tool: toolName(toolNames, event.data.callID) })
      return Effect.void
    default:
      return Effect.void
  }
}

function toolName(toolNames: Map<string, string>, callID: string): string {
  return toolNames.get(callID) ?? "igikoresho"
}

function extractFinalText(context: readonly unknown[]): string {
  // Prefer the last assistant message's text. Defensive: messages vary in shape.
  let out = ""
  for (const msg of context) {
    if (!msg || typeof msg !== "object") continue
    const m = msg as Record<string, unknown>
    if (m.type !== "assistant") continue
    const parts = (m.parts ?? []) as Array<Record<string, unknown>>
    const text = parts
      .filter((p) => p.type === "text" && typeof p.text === "string")
      .map((p) => p.text as string)
      .join("\n")
    if (text) out = text
  }
  return out
}

