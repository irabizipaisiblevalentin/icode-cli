export type LanguageMode = "rw" | "en" | "auto"
export type DetectedLanguage = "en"

export interface BaseIntent {
  action?: string
  target?: string
  problem?: string
  question?: boolean
}

export const LANGUAGE_MODES: LanguageMode[] = ["en"]

export const LANGUAGES: Record<LanguageMode, string> = {
  en: "English",
  rw: "English",
  auto: "English",
}

export function isLanguageMode(value: string): value is LanguageMode {
  return value === "rw" || value === "en" || value === "auto"
}