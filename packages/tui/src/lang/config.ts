export type LanguageMode = "rw" | "en" | "auto"
export type { DetectedLanguage, BaseIntent } from "./detect"
export { isLanguageMode, LANGUAGE_MODES, LANGUAGES, detectLanguage, extractIntent } from "./detect"

export interface EjoChatConfig {
  apiKey: string
  baseUrl: string
  model: string
  enabled: boolean
}

function isNonEmpty(value: string | undefined): value is string {
  return value !== undefined && value.length > 0
}

/**
 * Read the EjoChat configuration from the environment. No secrets are ever
 * printed; the key only lives in the returned config object and in auth
 * headers. Env vars: EJOCHAT_API_KEY, EJOCHAT_BASE_URL, EJOCHAT_MODEL,
 * EJOCHAT_DISABLED.
 */
export function ejoChatConfig(env: NodeJS.ProcessEnv = process.env): EjoChatConfig {
  const disabled = env.EJOCHAT_DISABLED === "1" || env.EJOCHAT_DISABLED === "true"
  return {
    apiKey: env.EJOCHAT_API_KEY ?? "",
    baseUrl: env.EJOCHAT_BASE_URL || "https://api.ejolabs.com/api/v1",
    model: env.EJOCHAT_MODEL || "claude-sonnet-4-5-20250929",
    enabled: !disabled && isNonEmpty(env.EJOCHAT_API_KEY),
  }
}

export function hasEjoChatKey(env: NodeJS.ProcessEnv = process.env): boolean {
  return isNonEmpty(env.EJOCHAT_API_KEY)
}