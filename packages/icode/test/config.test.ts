import { expect, test } from "bun:test"
import { loadConfig, DEFAULT_CONFIG, redactEnvSecrets } from "../src/config"

test("default config is English-first", () => {
  expect(DEFAULT_CONFIG.language).toBe("en")
  expect(DEFAULT_CONFIG.confirmDangerous).toBe(true)
})

test("env overrides language", () => {
  const config = loadConfig({ ICODE_LANGUAGE: "en" })
  expect(config.language).toBe("en")
})

test("redactEnvSecrets never leaks the key in strings", () => {
  const key = "ghp_xYzAbC1D2eF3gH4iJ5kLmNoPqRsTuVwX"
  const out = redactEnvSecrets(`using ${key} in logs`, { DEPLOY_TOKEN: key } as NodeJS.ProcessEnv)
  expect(out).not.toContain(key)
})

test("invalid language in config falls back to default", () => {
  expect(loadConfig({ ICODE_LANGUAGE: "fr" }).language).toBe("en")
})