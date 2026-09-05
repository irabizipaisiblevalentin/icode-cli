import { existsSync, readFileSync } from "node:fs"
import { homedir } from "node:os"
import { join } from "node:path"
import { stripCommentsAndParseJson, parseSimpleToml, parseSimpleYaml } from "../utils/parsers"
import { isLikelySecret } from "../security/secret"

export type LanguageMode = "rw" | "auto" | "en"

export interface ICodeConfig {
  language: LanguageMode
  /** Base URL of the EjoChat API (Anthropic-compatible messages endpoint). */
  ejochatBaseUrl: string
  /** The EjoChat model to use. */
  ejochatModel: string
  /** Whether to ever call EjoChat for Kinyarwanda understanding / explanation. */
  ejochatEnabled: boolean
  /** Show the technical error even when EjoChat is unavailable. */
  debug: boolean
  /** Term width fallback when detection fails. */
  termWidth: number
  /** Confirm dangerous commands before running (see spec section 10). */
  confirmDangerous: boolean
}

export const DEFAULT_CONFIG: ICodeConfig = {
  language: "rw",
  ejochatBaseUrl: "https://api.ejolabs.com/api/v1",
  ejochatModel: "claude-sonnet-4-5-20250929",
  ejochatEnabled: true,
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

  const ejochat = (v.ejochat ?? {}) as Record<string, unknown>
  if (ejochat && typeof ejochat.baseUrl === "string") out.ejochatBaseUrl = ejochat.baseUrl
  if (ejochat && typeof ejochat.model === "string") out.ejochatModel = ejochat.model
  if (ejochat && typeof ejochat.enabled === "boolean") out.ejochatEnabled = ejochat.enabled
  return out
}

function isLanguageMode(value: string): value is LanguageMode {
  return value === "rw" || value === "auto" || value === "en"
}

/** Merge file config with env var overrides. Env has highest precedence. */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): ICodeConfig {
  const file = readRaw()
  const fileConfig = file ? parseRaw(file.raw, file.name) : {}

  const fromEnv: Partial<ICodeConfig> = {}
  if (isNonEmpty(env.EJOCHAT_API_KEY)) fromEnv.ejochatEnabled = true
  if (env.EJOCHAT_BASE_URL) fromEnv.ejochatBaseUrl = env.EJOCHAT_BASE_URL
  if (env.EJOCHAT_MODEL) fromEnv.ejochatModel = env.EJOCHAT_MODEL
  if (env.ICODE_LANGUAGE && isLanguageMode(env.ICODE_LANGUAGE)) fromEnv.language = env.ICODE_LANGUAGE
  if (env.ICODE_DEBUG === "1" || env.ICODE_DEBUG === "true") fromEnv.debug = true
  if (env.EJOCHAT_DISABLED === "1" || env.EJOCHAT_DISABLED === "true") fromEnv.ejochatEnabled = false

  return { ...DEFAULT_CONFIG, ...fileConfig, ...fromEnv }
}

function isNonEmpty(value: string | undefined): value is string {
  return value !== undefined && value.length > 0
}

export function apiKey(env: NodeJS.ProcessEnv = process.env): string {
  return env.EJOCHAT_API_KEY ?? ""
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

export function hasEjoChatKey(env: NodeJS.ProcessEnv = process.env): boolean {
  return isNonEmpty(env.EJOCHAT_API_KEY)
}
