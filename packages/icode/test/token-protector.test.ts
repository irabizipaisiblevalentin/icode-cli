import { expect, test } from "bun:test"
import { TokenProtector } from "../src/language/token-protector"

test("protect/restore keeps file paths intact through language processing", () => {
  const p = new TokenProtector()
  const input = "Reba src/auth/login.ts umbwire impamvu login idakora."
  const protectedText = p.protect(input)
  expect(protectedText).not.toContain("src/auth/login.ts")
  // Simulate a translation that would otherwise mangle the path.
  const fakeTranslation = "Reba __FAKE__ umbwire impamvu."
  const restored = p.restore(fakeTranslation.replace("__FAKE__", protectedText))
  void restored
  expect(p.restore(protectedText)).toContain("src/auth/login.ts")
})

test("restore reconstructs the exact original technical content", () => {
  const examples = [
    "Reba src/auth/login.ts ukore npm test.",
    "Kosora ikibazo kiri muri components/Login.tsx.",
    "Genda uri https://example.com/docs.",
    "Uses process.env.API_KEY and code: const x = f(1)",
  ]
  for (const example of examples) {
    const p = new TokenProtector()
    const protectedText = p.protect(example)
    expect(p.restore(protectedText)).toBe(example)
  }
})

test("code blocks and inline code are never corrupted", () => {
  const p = new TokenProtector()
  const code = "```ts\nconst user = await login(email)\n```"
  const protectedText = p.protect(`Sobanura: ${code}`)
  expect(protectedText).not.toContain("await login")
  expect(p.restore(protectedText)).toContain(code)
})

test("commands and URLs are protected and restored", () => {
  const p = new TokenProtector()
  const input = "Shaka impamvu server yanze gutangira: run npm run build, then git push."
  const protectedText = p.protect(input)
  expect(p.restore(protectedText)).toBe(input)
})

test("restores even when the language model strips the placeholder wrapper", () => {
  const p = new TokenProtector()
  const protectedText = p.protect("Reba src/auth/login.ts umbwire impamvu.")
  // The model received __TOK0__ but echoed back only the bare "TOK0".
  const modelOutput = "Nsoma TOK0 ngo menye impamvu."
  const restored = p.restore(modelOutput)
  expect(restored).toContain("src/auth/login.ts")
  expect(restored).not.toContain("TOK")
})

test("returns no placeholders in restored output", () => {
  const p = new TokenProtector()
  const protectedText = p.protect("Kosora src/api/client.ts kandi ugenzure npm test.")
  expect(p.restore(protectedText)).not.toMatch(/TOK\d/)
})
