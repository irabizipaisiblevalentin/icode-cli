import { KINYARWANDA_MARKERS, KINYARWANDA_WORDS, INTENT_VERBS } from "./kinyarwanda"
import type { LanguageMode } from "../config"

export type DetectedLanguage = "rw" | "en" | "unknown"

export interface BaseIntent {
  action?: string
  target?: string
  problem?: string
  question?: boolean
}

export interface DetectedInput {
  language: DetectedLanguage
  isKinyarwanda: boolean
  intent: BaseIntent
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[.,;:!?()\[\]{}"']+/g, " ")
    .split(/\s+/)
    .filter(Boolean)
}

/** Guess whether a text is Kinyarwanda based on known vocabulary frequency. */
export function detectLanguage(text: string, mode: LanguageMode = "rw"): DetectedLanguage {
  if (mode === "rw") return "rw"
  if (mode === "en") return "en"
  const words = tokenize(text)
  if (words.length === 0) return "unknown"
  // A technical-token-heavy prompt with little rw vocabulary is unlikely to be rw.
  let rwScore = 0
  let markerScore = 0
  for (const w of words) {
    if (KINYARWANDA_WORDS.has(w)) rwScore++
    if (KINYARWANDA_MARKERS.has(w)) markerScore += 2
  }
  const needed = Math.max(1, Math.min(2, Math.floor(words.length / 8)))
  if (rwScore + markerScore >= needed) return "rw"
  return "unknown"
}

/** Extract a structured intent from a Kinyarwanda (or mixed) developer request. */
export function extractIntent(text: string): BaseIntent {
  const lower = text.toLowerCase()
  const words = tokenize(text)
  const intent: BaseIntent = {}

  let best: IntentTokenLike | undefined
  for (const verb of INTENT_VERBS) {
    if (lower.includes(verb.word)) {
      if (!best || verb.weight > best.weight) best = verb
    }
  }
  if (best) intent.action = best.action

  // Target: a file path or identifier followed/implied by inspection.
  const pathMatch = /[\w.@~/\-]+\.(?:ts|tsx|js|jsx|py|json|jsonc|toml|yaml|yml|md|rs|go|c|cpp|java|rb|php|sh|css|html|txt|sql|log|lock|mod|sum)\b/i.exec(text)
  if (pathMatch) intent.target = pathMatch[0]

  // Problem signal: idakora / ntago akora / ananze / ikosa / permission denied.
  if (/(idakora|ntago[ _-]?akora|ntakora|yanze|anze|itangiye|ikosa|amakosa|bug|error|failed|permission denied|crash)/i.test(lower)) {
    intent.problem = "not-working"
  }

  intent.question = /\?$/.test(text.trim()) || /^(niba|mbwira|sobanura|kuki|kubera(?:iki)?|ni\s+iki|ni\s+iyi|niibiki)\b/i.test(lower)

  return intent
}

interface IntentTokenLike {
  action: string
  weight: number
}

/** Roughly how confident we are this input is Kinyarwanda (0..1). */
export function kinyarwandaConfidence(text: string): number {
  const words = tokenize(text)
  if (words.length === 0) return 0
  let rwScore = 0
  let markerScore = 0
  for (const w of words) {
    if (KINYARWANDA_WORDS.has(w)) rwScore++
    if (KINYARWANDA_MARKERS.has(w)) markerScore += 2
  }
  const total = rwScore + markerScore
  return Math.min(1, total / Math.max(3, words.length / 3))
}
