export * as Lang from "."

export type { LanguageMode } from "./config"
export {
  isLanguageMode,
  LANGUAGE_MODES,
  LANGUAGES,
} from "./detect"
export { t, translate, updateLanguage, language, type TranslationKey } from "./translations"