import { chat, EjoChatError, shouldUseEjoChat } from "./ejochat"
import type { EjoChatMessage } from "./ejochat"
import { protectTokens } from "./token-protector"
import { redactSecrets, redactEnvSecrets } from "../security/secret"
import type { ICodeConfig } from "../config"

export interface KinyarwandaUnderstanding {
  /** Normalized/understood user intent and explanation. */
  explanation: string
  /** Whether understanding was produced by EjoChat or a local fallback. */
  source: "ejochat" | "local"
}

export interface KinyarwandaServiceOptions {
  config: ICodeConfig
  apiKey: string
  env: NodeJS.ProcessEnv
}

/**
 * KinyarwandaService is iCode's Kinyarwanda language-intelligence layer.
 * It never runs coding tools: OpenCode remains responsible for files,
 * terminal, Git, code generation and command execution. EjoChat only
 * improves Kinyarwanda understanding, generation and explanation.
 *
 * Every request passes through token protection and secret redaction so
 * technical content is never corrupted and secrets are never sent upstream.
 */
export class KinyarwandaService {
  constructor(private readonly options: KinyarwandaServiceOptions) {}

  private get config() {
    return this.options.config
  }

  /** Whether EjoChat is available at all (key present + enabled). */
  available(): boolean {
    return this.config.ejochatEnabled && this.options.apiKey.length > 0
  }

  private async call(needsRw: boolean, system: string, prompt: string, convo?: EjoChatMessage[]): Promise<string | null> {
    const should = shouldUseEjoChat(this.config, needsRw)
    if (!should || !this.available()) return null

    const { text, restore } = protectTokens(prompt)
    let guarded = redactEnvSecrets(text, this.options.env)
    guarded = redactSecrets(guarded)

    try {
      const result = await chat(
        {
          baseUrl: this.config.ejochatBaseUrl,
          model: this.config.ejochatModel,
          apiKey: this.options.apiKey,
          system,
        },
        [...(convo ?? []), { role: "user", content: guarded }],
      )
      return restore(result.text)
    } catch (error) {
      if (error instanceof EjoChatError) return null
      return null
    }
  }

  /** Clean up / normalize Kinyarwanda text while preserving technical tokens. */
  async normalizeKinyarwanda(input: string): Promise<string> {
    const system =
      "Uri umuhanga w'indimi za Kinyarwanda. Sikiza Kinyarwanda cyasizwe neza, uhindure amagambo mu buryo busobanutse n'ubwiza. Ntugahindure ibintu mpandesha (code, paths, commands, URLs, identifiers). Subiza gusa text isukuye."
    const result = await this.call(true, system, input)
    return result ?? localNormalize(input)
  }

  /** Understand a Kinyarwanda developer request: extract intent + a clear explanation. */
  async understandKinyarwanda(input: string, intent: string): Promise<KinyarwandaUnderstanding> {
    const system =
      "Uri umuhanga w'iterambere ry'ibyo byateguwe mu Kinyarwanda. Soma icyifuzo cyumukoresha ukimenye: (1) icyo asaba (action), (2) ibyo areba (target), (3) ikibazo (problem). Sobanura mu Kinyarwanda gisobanutse n'ishami rito. Ukoresheje izina ry'ikoranabuhanga (API, server, database...) mu Cyongereza igihe ari byiza, maze uzisobanure mu Kinyarwanda."
    const result = await this.call(true, system, `${input}\n\nIntent detected: ${intent}`)
    if (!result) return { explanation: localFallbackExplanation(input), source: "local" }
    return { explanation: result, source: "ejochat" }
  }

  /** Explain a technical result in clear Kinyarwanda. Code/tools stay with OpenCode. */
  async explainInKinyarwanda(technicalResult: string, userRequest: string): Promise<string | null> {
    if (!this.available()) return null
    const system =
      "Uri umuhanga ubona ibisubizo by'ikoranabuhanga ukabyisobanura mu Kinyarwanda kigera kuri wese. Urakoresha amagambo y'ikoranabuhanga (API, server, error, file...) mu Cyongereza, maze ukayasobanura mu Kinyarwanda. Ukomeza ari gato, utarakorana amakosa. Ntabwo usenya code: ibice by'ingenzi ubigira mu gace gato k'urwego rwa code."
    const body = `Icyifuzo cy'umukoresha: ${userRequest}\n\nIbisubizo by'ikoranabuhanga:\n${technicalResult}`
    return this.call(true, system, body)
  }

  /** Summarize a technical result in Kinyarwanda. */
  async summarizeInKinyarwanda(technicalResult: string): Promise<string | null> {
    if (!this.available()) return null
    const system =
      "Uri umuhanga akusanya amakuru y'ikoranabuhanga mu Kinyarwanda. Andika inshutso ngufi isobanutse: icyo cyabaye, impamvu, n'icydukorerwa. Ukoresha amagambo y'ikoranabuhanga akenewe gusa."
    return this.call(true, system, technicalResult)
  }

  /** Generate Kinyarwanda text (e.g. code comments, summaries) on request. */
  async generateKinyarwanda(spec: string): Promise<string | null> {
    if (!this.available()) return null
    const system =
      "Uri umwanditsi w'indimi za Kinyarwanda ziteye imbere. Andika ibyo umukoresha asaba mu Kinyarwanda cyiza gisobanutse. Ntugahindure code cyangwa syntax. Amagambo y'ikoranabuhanga usige ari mu Cyongereza."
    return this.call(true, system, spec)
  }

  /** Improve existing Kinyarwanda towards more natural, modern phrasing. */
  async improveKinyarwanda(text: string): Promise<string> {
    if (!this.available()) return text
    const system =
      "Uri umuhanga w'indimi za Kinyarwanda. Gezwe iyi text utayihindura code cyangwa amagambo y'ikoranabuhanga. Gezwe ukuri k'uburyo busobanutse n'umwuga."
    const result = await this.call(true, system, text)
    return result ?? text
  }
}

function localNormalize(text: string): string {
  return text.trim().replace(/\s+/g, " ").replace(/\s+([.,;:!?])/g, "$1")
}

function localFallbackExplanation(input: string): string {
  const clean = localNormalize(input)
  if (clean.length === 0) return "Sinsobanukanye icyafashwe. Nyamuneka subiramo icyifuzo cyawe."
  return `Nsobanukiwe icyifuzo cyawe. Ndimo gushaka icyakorwa kuri: "${clean}".`
}
