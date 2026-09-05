import { afterAll, beforeAll, expect, test } from "bun:test"
import { chat, EjoChatError, shouldUseEjoChat } from "../src/language/ejochat"
import type { ICodeConfig } from "../src/config"

let server: ReturnType<typeof Bun.serve> | undefined
let received: { path: string; headers: Headers; body: unknown } | undefined

beforeAll(() => {
  server = Bun.serve({
    port: 0,
    fetch(req) {
      if (req.method === "POST" && req.url.endsWith("/subiza")) {
        received = {
          path: new URL(req.url).pathname,
          headers: new Headers(req.headers),
          body: undefined,
        }
        return req.json().then((json) => {
          received!.body = json
          return Response.json({
            choices: [{ message: { role: "assistant", content: "Umubitso mu Kinyarwanda w'icyatumye." } }],
            usage: { prompt_tokens: 5, completion_tokens: 4 },
            model: "test-model",
          })
        })
      }
      return new Response("not found", { status: 404 })
    },
  })
  void received
})

afterAll(() => {
  server?.stop()
})

test("chat posts EjoChat-style messages to /subiza with X-API-Key", async () => {
  const port = server?.port
  expect(port).toBeDefined()
  const baseUrl = `http://127.0.0.1:${port}/api/v1`

  const result = await chat(
    { baseUrl, model: "m1", apiKey: "ejochat_SomeSecret12345" },
    [{ role: "user", content: "Sobanura iyi dosiye" }],
  )

  expect(received?.path).toBe("/api/v1/subiza")
  expect(received?.headers.get("x-api-key")).toBe("ejochat_SomeSecret12345")
  expect(received?.headers.get("authorization")).toBe("Bearer ejochat_SomeSecret12345")
  expect((received?.body as { model: string }).model).toBe("m1")
  expect((received?.body as { messages: unknown[] }).messages).toHaveLength(1)
  expect(((received?.body as { messages: Array<{ role: string }> }).messages[0]?.role)).toBe("user")
  expect(result.text).toContain("Kinyarwanda")
  expect(result.usage).toEqual({ input: 5, output: 4 })
})

test("a system prompt is sent as the first system message", async () => {
  const port = server?.port
  const result = await chat(
    { baseUrl: `http://127.0.0.1:${port}/api/v1`, model: "m1", apiKey: "ejochat_k", system: "Uri umuhanga." },
    [{ role: "user", content: "hi" }],
  )
  const messages = (received?.body as { messages: Array<{ role: string }> }).messages
  expect(messages).toHaveLength(2)
  expect(messages[0]?.role).toBe("system")
  expect(result.text.length).toBeGreaterThan(0)
})

test("shouldUseEjoChat gates on enabled + needsRw", () => {
  const config: Pick<ICodeConfig, "ejochatEnabled"> = { ejochatEnabled: true }
  const disabled: Pick<ICodeConfig, "ejochatEnabled"> = { ejochatEnabled: false }
  expect(shouldUseEjoChat(config as ICodeConfig, true)).toBe(true)
  expect(shouldUseEjoChat(disabled as ICodeConfig, true)).toBe(false)
  expect(shouldUseEjoChat(config as ICodeConfig, false)).toBe(false)
})

test("non-2xx yields EjoChatError without leaking the key", async () => {
  const port = server?.port
  const baseUrl = `http://127.0.0.1:${port}/v1`
  // Point at a second, failing endpoint: reuse server but force an error via bad path is not possible;
  // instead build a small local server that always fails.
  const failServer = Bun.serve({
    port: 0,
    fetch() {
      return new Response(JSON.stringify({ error: { message: "oops" } }), {
        status: 500,
        headers: { "content-type": "application/json" },
      })
    },
  })
  try {
    const err = await chat(
      { baseUrl: `http://127.0.0.1:${failServer.port}/v1`, model: "m1", apiKey: "ejochat_ShouldNeverLeak99" },
      [{ role: "user", content: "hi" }],
    ).then(
      () => null,
      (e) => e,
    )
    expect(err).toBeInstanceOf(EjoChatError)
    expect(JSON.stringify(err)).not.toContain("ShouldNeverLeak")
  } finally {
    void baseUrl
    failServer.stop()
  }
})
