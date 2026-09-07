import { expect, test } from "bun:test"
import { isLikelySecret, redactSecrets, redactKnownSecrets, redactEnvSecrets } from "../src/security/secret"

test("isLikelySecret recognizes key prefixes and high-entropy tokens", () => {
  expect(isLikelySecret("ghp_" + "xYzAbC1D2eF3gH4iJ5kLmNoPqRsTuVwX")).toBe(true)
  expect(isLikelySecret("sk-ant-" + "abc123def456ghi789jkl012mno345pqr678")).toBe(true)
  expect(isLikelySecret("xoxb-" + "1234567890-abcdefghijklmnopqrstuvwxyz")).toBe(true)
  expect(isLikelySecret("NotASecretValue")).toBe(false)
  expect(isLikelySecret("hello world plain text short")).toBe(false)
})

test("redactSecrets doesn't touch normal source code strings", () => {
  const code = "const name = \"julie\"\nconsole.log(\"hello\")\n"
  expect(redactSecrets(code)).toBe(code)
})

test("redactKnownSecrets removes specific values", () => {
  const text = "connecting with token abcdefghijk1234567890"
  expect(redactKnownSecrets(text, ["abcdefghijk1234567890"])).not.toContain("abcdefghijk1234567890")
})

test("redactEnvSecrets removes secret-like env values from text", () => {
  const env = { DEPLOY_TOKEN: "ghp_xYzAbC1D2eF3gH4iJ5kLmNoPqRsTuVwX", OTHER: "visible" } as NodeJS.ProcessEnv
  const text = "api key is ghp_xYzAbC1D2eF3gH4iJ5kLmNoPqRsTuVwX keep it safe"
  const out = redactEnvSecrets(text, env)
  expect(out).not.toContain("ghp_xYzAbC1D2eF3gH4iJ5kLmNoPqRsTuVwX")
  expect(out).toContain("keep it safe")
})

test("jwt-like tokens are redacted", () => {
  const jwt = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
  expect(redactSecrets(`token present ${jwt} here`)).not.toContain("SflKxwR")
})
