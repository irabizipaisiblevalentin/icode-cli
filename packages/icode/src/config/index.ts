import { existsSync, readFileSync } from "node:fs"
import { homedir } from "node:os"
import { join } from "node:path"
import { stripCommentsAndParseJson, parseSimpleToml, parseSimpleYaml } from "../utils/parsers"
import { isLikelySecret } from "../security/secret"

export type LanguageMode = "en"

export interface ICodeConfig {
  language: LanguageMode
  /** Show the technical error even when the coding engine fails. */
  debug: boolean
  /** Term width fallback when detection fails. */
  termWidth: number
  /** Confirm dangerous commands before running (see spec section 10). */
  confirmDangerous: boolean
}

export const DEFAULT_CONFIG: ICodeConfig = {
  language: "en",
  debug: false,
  termWidth: 100,
  confirmDangerous: true,
}

const CONFIG_NAMES = ["config.json", "config.jsonc", "config.toml", "config.yaml", "config.yml"]

function configDir(): string {
  return process.env.ICODE_CONFIG_DIR ?? join(homedir(), ".config", "icode")
}

function readRaw(): { raw: string; name: string } | undefined {
  const base = configDir()
  for (const name of CONFIG_NAMES) {
    const file = join(base, name)
    if (existsSync(file)) return { raw: readFileSync(file, "utf8"), name }
  }
  const override = process.env.ICODE_CONFIG
  if (override && existsSync(override)) {
    return { raw: readFileSync(override, "utf8"), name: override }
  }
  return undefined
}

function parseRaw(raw: string, name: string): Partial<ICodeConfig> {
  let value: unknown
  if (name.endsWith(".json") || name.endsWith(".jsonc")) {
    value = stripCommentsAndParseJson(raw)
  } else if (name.endsWith(".toml")) {
    value = parseSimpleToml(raw)
  } else {
    value = parseSimpleYaml(raw)
  }
  return normalize(value)
}

function normalize(value: unknown): Partial<ICodeConfig> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {}
  const v = value as Record<string, unknown>
  const out: Partial<ICodeConfig> = {}
  if (typeof v.language === "string" && isLanguageMode(v.language)) out.language = v.language
  if (typeof v.debug === "boolean") out.debug = v.debug
  if (typeof v.termWidth === "number") out.termWidth = Math.max(20, Math.floor(v.termWidth))
  if (typeof v.confirmDangerous === "boolean") out.confirmDangerous = v.confirmDangerous
  return out
}

function isLanguageMode(value: string): value is LanguageMode {
  return value === "en"
}

/** Merge file config with env var overrides. Env has highest precedence. */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): ICodeConfig {
  const file = readRaw()
  const fileConfig = file ? parseRaw(file.raw, file.name) : {}

  const fromEnv: Partial<ICodeConfig> = {}
  if (env.ICODE_LANGUAGE && isLanguageMode(env.ICODE_LANGUAGE)) fromEnv.language = env.ICODE_LANGUAGE
  if (env.ICODE_DEBUG === "1" || env.ICODE_DEBUG === "true") fromEnv.debug = true

  return { ...DEFAULT_CONFIG, ...fileConfig, ...fromEnv }
}

function isNonEmpty(value: string | undefined): value is string {
  return value !== undefined && value.length > 0
}

/** Redact any secret material found in the env into placeholder text (never printed). */
export function redactEnvSecrets(input: string, env: NodeJS.ProcessEnv = process.env): string {
  let out = input
  for (const value of Object.values(env)) {
    if (!value || value.length < 8) continue
    if (!isLikelySecret(value)) continue
    out = out.split(value).join("***")
  }
  return out
}
