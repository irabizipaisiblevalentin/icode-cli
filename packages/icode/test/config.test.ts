import { expect, test } from "bun:test"
import { loadConfig, DEFAULT_CONFIG, hasEjoChatKey, apiKey, redactEnvSecrets } from "../src/config"

test("default config is rw-first", () => {
  expect(DEFAULT_CONFIG.language).toBe("rw")
  expect(DEFAULT_CONFIG.confirmDangerous).toBe(true)
})

test("env overrides language and ejochat base URL", () => {
  const config = loadConfig({
    ICODE_LANGUAGE: "en",
    EJOCHAT_BASE_URL: "https://custom.ejochat.example/v1",
    EJOCHAT_API_KEY: "ejochat_abc",
  })
  expect(config.language).toBe("en")
  expect(config.ejochatBaseUrl).toBe("https://custom.ejochat.example/v1")
  expect(config.ejochatEnabled).toBe(true)
})

test("EJOCHAT_DISABLED disables EjoChat", () => {
  const config = loadConfig({ EJOCHAT_DISABLED: "1", EJOCHAT_API_KEY: "ejochat_abc" })
  expect(config.ejochatEnabled).toBe(false)
})

test("hasEjoChatKey reflects presence without exposing the value", () => {
  expect(hasEjoChatKey({ EJOCHAT_API_KEY: "ejochat_secret12345" })).toBe(true)
  expect(hasEjoChatKey({})).toBe(false)
})

test("apiKey returns the key without logging it", () => {
  const key = apiKey({ EJOCHAT_API_KEY: "ejochat_mysecret999" })
  expect(key).toBe("ejochat_mysecret999")
})

test("redactEnvSecrets never leaks the key in strings", () => {
  const key = "ejochat_vAn0tHeRseCrEt000"
  const out = redactEnvSecrets(`using ${key} in logs`, { EJOCHAT_API_KEY: key })
  expect(out).not.toContain(key)
})

test("invalid language in config falls back to default", () => {
  expect(loadConfig({ ICODE_LANGUAGE: "fr" }).language).toBe("rw")
})
