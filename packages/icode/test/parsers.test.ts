import { expect, test } from "bun:test"
import { parseSimpleToml, parseSimpleYaml, stripCommentsAndParseJson } from "../src/utils/parsers"

test("stripCommentsAndParseJson parses JSONC with comments and trailing commas", () => {
  const out = stripCommentsAndParseJson(`{
    // comment
    "language": "en",
    "debug": false,
  }`) as Record<string, unknown>
  expect(out.language).toBe("en")
  expect(out.debug).toBe(false)
})

test("parseSimpleToml parses tables and values", () => {
  const t = parseSimpleToml(`
language = "en"
debug = true

[ejochat]
baseUrl = "https://x.example/v1"
model = "m1"
`) as Record<string, unknown>
  expect(t.language).toBe("en")
  expect((t.ejochat as Record<string, unknown>).model).toBe("m1")
  expect((t.ejochat as Record<string, unknown>).baseUrl).toBe("https://x.example/v1")
})

test("parseSimpleYaml parses nested maps", () => {
  const y = parseSimpleYaml(`
language: en
ejochat:
  model: somemodel
  enabled: true
`) as Record<string, unknown>
  expect(y.language).toBe("en")
  expect((y.ejochat as Record<string, unknown>).enabled).toBe(true)
})
