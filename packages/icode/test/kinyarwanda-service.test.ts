import { expect, test } from "bun:test"
import { KinyarwandaService } from "../src/language/kinyarwanda-service"
import { DEFAULT_CONFIG } from "../src/config"

const baseOptions = {
  config: DEFAULT_CONFIG,
  apiKey: "",
  env: {},
}

test("service reports unavailable when no key and never calls network", () => {
  const svc = new KinyarwandaService(baseOptions)
  expect(svc.available()).toBe(false)
})

test("explainInKinyarwanda returns null when EjoChat unavailable", async () => {
  const svc = new KinyarwandaService(baseOptions)
  const out = await svc.explainInKinyarwanda("Some technical output", "Sobanura")
  expect(out).toBeNull()
})

test("normalizeKinyarwanda falls back to local cleaning without key", async () => {
  const svc = new KinyarwandaService(baseOptions)
  const out = await svc.normalizeKinyarwanda("  Hello    world  ")
  expect(out).toBe("Hello world")
})

test("understandKinyarwanda returns a local explanation when offline", async () => {
  const svc = new KinyarwandaService(baseOptions)
  const out = await svc.understandKinyarwanda("Reba dosiye", "inspect")
  expect(out.source).toBe("local")
  expect(out.explanation.length).toBeGreaterThan(0)
})

test("improveKinyarwanda returns input unchanged when offline", async () => {
  const svc = new KinyarwandaService(baseOptions)
  const out = await svc.improveKinyarwanda("Amakuru ngo yuzuye")
  expect(out).toBe("Amakuru ngo yuzuye")
})

test("generateKinyarwanda returns null when offline", async () => {
  const svc = new KinyarwandaService(baseOptions)
  expect(await svc.generateKinyarwanda("andika inshutso")).toBeNull()
})
