import { expect, test } from "bun:test"
import { detectLanguage, extractIntent, kinyarwandaConfidence } from "../src/language/detector"

test("detects Kinyarwanda in default rw mode", () => {
  expect(detectLanguage("Reba iyi dosiye umbwire icyo ikora.")).toBe("rw")
  expect(detectLanguage("Kosora ikibazo kiri muri iyi code.")).toBe("rw")
  expect(detectLanguage("hello world how are you")).toBe("rw") // rw mode forces rw
})

test("auto mode distinguishes English from Kinyarwanda", () => {
  expect(detectLanguage("Explain how the login works", "auto")).not.toBe("rw")
  expect(detectLanguage("Sobanura uko login ikora", "auto")).toBe("rw")
})

test("en mode never treats input as rw", () => {
  expect(detectLanguage("Reba iyi dosiye", "en")).toBe("en")
})

test("extractIntent finds action, target and problem", () => {
  const intent = extractIntent("Reba src/auth/login.ts umbwire impamvu login idakora.")
  expect(intent.target).toContain("login.ts")
  expect(intent.problem).toBeDefined()
  expect(intent.action).toBeDefined()
})

test("extractIntent finds fix intent", () => {
  const intent = extractIntent("Kosora ikibazo kiri muri iyi code navigation.")
  expect(intent.action).toBe("fix")
})

test("kinyarwandaConfidence is higher for rw-heavy text", () => {
  const rw = kinyarwandaConfidence("Sobanura uko Porogaramu ikora mu buryo busobanutse")
  const en = kinyarwandaConfidence("The quick brown fox jumps over the lazy dog")
  expect(rw).toBeGreaterThan(en)
})
