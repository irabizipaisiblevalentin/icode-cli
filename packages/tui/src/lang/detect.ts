export type LanguageMode = "en"
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
}

export function isLanguageMode(value: string): value is LanguageMode {
  return value === "en"
}