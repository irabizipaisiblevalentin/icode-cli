export interface EjoChatMessage {
  role: "system" | "user" | "assistant"
  content: string
}

export interface EjoChatOptions {
  /** Base URL, e.g. https://api.ejolabs.com/api/v1 (the "/subiza" path is appended). */
  baseUrl: string
  model: string
  apiKey: string
  system?: string
  maxTokens?: number
  signal?: AbortSignal
}

export interface EjoChatResult {
  text: string
  usage?: { input: number; output: number }
  model: string
}

export class EjoChatError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly raw?: string,
  ) {
    super(message)
    this.name = "EjoChatError"
  }
}

/**
 * Kinyarwanda language service backed by the EjoChat API
 * (POST {baseUrl}/subiza, OpenAI-style `messages`, auth via `X-API-Key`).
 *
 * EjoChat is only a language-intelligence layer: it never runs coding tools.
 * The API key is only ever sent in the auth headers and never printed.
 */
export async function chat(options: EjoChatOptions, messages: EjoChatMessage[]): Promise<EjoChatResult> {
  const convo: EjoChatMessage[] = options.system
    ? [{ role: "system", content: options.system }, ...messages]
    : messages

  const payload = {
    model: options.model,
    messages: convo.map((m) => ({ role: m.role, content: m.content })),
  }

  const base = options.baseUrl.replace(/\/+$/, "")
  const endpoint = base.endsWith("/subiza") ? base : `${base}/subiza`
  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": options.apiKey,
      "authorization": `Bearer ${options.apiKey}`,
    },
    body: JSON.stringify(payload),
    signal: options.signal,
  })

  if (!res.ok) {
    throw new EjoChatError(`EjoChat API error ${res.status}`, res.status, (await res.clone().text().catch(() => "")).slice(0, 300))
  }

  const data = (await res.json()) as Record<string, unknown>
  const text = extractText(data)
  const usage = extractUsage(data)
  const model = typeof data.model === "string" ? data.model : options.model

  return { text, usage, model }
}

function extractText(data: Record<string, unknown>): string {
  const choices = asArray(data.choices)
  if (choices.length > 0) {
    const first = choices[0] as Record<string, unknown>
    const msg = first.message as Record<string, unknown> | undefined
    if (msg && typeof msg.content === "string") return msg.content
    if (typeof first.text === "string") return first.text
  }
  const content = asArray(data.content)
  if (content.length > 0) {
    const parts: string[] = []
    for (const block of content) {
      const b = block as Record<string, unknown>
      if (typeof b.text === "string") parts.push(b.text)
    }
    if (parts.length > 0) return parts.join("")
  }
  for (const key of ["answer", "text", "response", "result", "output"] as const) {
    const value = data[key]
    if (typeof value === "string") return value
  }
  return ""
}

function extractUsage(data: Record<string, unknown>): { input: number; output: number } {
  const usage = (data.usage ?? {}) as Record<string, unknown>
  return {
    input:
      (typeof usage.input_tokens === "number" ? usage.input_tokens : 0) ||
      (typeof usage.prompt_tokens === "number" ? usage.prompt_tokens : 0),
    output:
      (typeof usage.output_tokens === "number" ? usage.output_tokens : 0) ||
      (typeof usage.completion_tokens === "number" ? usage.completion_tokens : 0),
  }
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}