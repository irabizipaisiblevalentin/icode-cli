import { chat, EjoChatError, type EjoChatMessage } from "./ejochat"
import type { EjoChatConfig } from "./config"
import type { BaseIntent } from "./detect"
import { protectTokens } from "./protect"
import { redactEnvSecrets, redactSecrets } from "./protect"

export interface KinyarwandaUnderstanding {
  explanation: string
  source: "ejochat" | "local"
}

/**
 * KinyarwandaService is iCode's Kinyarwanda language-intelligence layer.
 * It never runs coding tools: the coding engine remains responsible for
 * files, terminal, Git, code generation and command execution. EjoChat only
 * improves Kinyarwanda understanding, generation and explanation.
 *
 * Every request passes through token protection and secret redaction so
 * technical content is never corrupted and secrets are never sent upstream.
 */
export class KinyarwandaService {
  constructor(private readonly options: { config: EjoChatConfig; env: NodeJS.ProcessEnv }) {}

  available(): boolean {
    return this.options.config.enabled
  }

  private async call(needsRw: boolean, system: string, prompt: string, convo?: EjoChatMessage[]): Promise<string | null> {
    if (!needsRw || !this.available()) return null

    const { text, restore } = protectTokens(prompt)
    let guarded = redactEnvSecrets(text, this.options.env)
    guarded = redactSecrets(guarded)

    try {
      const result = await chat(
        {
          baseUrl: this.options.config.baseUrl,
          model: this.options.config.model,
          apiKey: this.options.config.apiKey,
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

  async normalizeKinyarwanda(input: string): Promise<string> {
    const system =
      "Uri umuhanga w'indimi za Kinyarwanda. Sikiza Kinyarwanda cyasizwe neza, uhindure amagambo mu buryo busobanutse n'ubwiza. Ntugahindure ibintu mpandesha (code, paths, commands, URLs, identifiers). Subiza gusa text isukuye."
    const result = await this.call(true, system, localNormalize(input))
    return result ?? localNormalize(input)
  }

  async understandKinyarwanda(input: string, intent: string | BaseIntent): Promise<KinyarwandaUnderstanding> {
    const system =
      "Uri umuhanga w'iterambere ry'ibyo byateguwe mu Kinyarwanda. Soma icyifuzo cy'umukoresha ukimenye: (1) icyo asaba (action), (2) ibyo areba (target), (3) ikibazo (problem). Sobanura mu Kinyarwanda gisobanutse n'ishami rito. Ukoresheje izina ry'ikoranabuhanga (API, server, database...) mu Cyongereza igihe ari byiza, maze uzisobanure mu Kinyarwanda."
    const intentText = typeof intent === "string" ? intent : JSON.stringify(intent)
    const result = await this.call(true, system, `${input}\n\nIntent detected: ${intentText}`)
    if (!result) return { explanation: localFallbackExplanation(input), source: "local" }
    return { explanation: result, source: "ejochat" }
  }

  async explainInKinyarwanda(technicalResult: string, userRequest: string): Promise<string | null> {
    if (!this.available()) return null
    const system =
      "Uri umuhanga ubona ibisubizo by'ikoranabuhanga ukabyisobanura mu Kinyarwanda kigera kuri wese. Urakoresha amagambo y'ikoranabuhanga (API, server, error, file...) mu Cyongereza, maze ukayasobanura mu Kinyarwanda. Ukomeza ari gato, utarakorana amakosa. Ntabwo usenya code: ibice by'ingenzi ubigira mu gace gato k'urwego rwa code."
    const body = `Icyifuzo cy'umukoresha: ${userRequest}\n\nIbisubizo by'ikoranabuhanga:\n${technicalResult}`
    return this.call(true, system, body)
  }

  async summarizeInKinyarwanda(technicalResult: string): Promise<string | null> {
    if (!this.available()) return null
    const system =
      "Uri umuhanga akusanya amakuru y'ikoranabuhanga mu Kinyarwanda. Andika inshutso ngufi isobanutse: icyo cyabaye, impamvu, n'icyo gukorwa. Ukoresha amagambo y'ikoranabuhanga akenewe gusa."
    return this.call(true, system, technicalResult)
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