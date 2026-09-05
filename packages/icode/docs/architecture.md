# Architecture

## Design principles

1. **Kinyarwanda-first, engineering-second.** UX copy and explanations default to
   Kinyarwanda, but code, syntax, identifiers, paths, and commands are never
   translated.
2. **Two disjoint layers.** `KinyarwandaService` (language intelligence via
   EjoChat) and `OpenCodeAgent` (the coding engine). They only communicate
   through the middleware in `shell.ts`, never through shared state.
3. **Graceful degradation.** If EjoChat is unavailable, iCode keeps working as a
   coding agent; language features fall back to local, dictionary-free handling.

## Module responsibilities

- `cli/renderer.ts` — semantic boxes/status lines; `cli/theme.ts` — glyph
  (Unicode/ASCII) and color detection; `cli/spinner.ts` — single-line animation;
  `cli/prompt.ts` — readline input; `cli/terminal.ts` — dimensions & resize;
  `cli/slashes.ts` — command registry; `cli/danger.ts` — destructive-command
  detection; `cli/shell.ts` — session loop, middleware orchestration.
- `language/token-protector.ts` — technical token protection/restoration.
- `language/detector.ts` — language classification + intent extraction.
- `language/kinyarwanda.ts` — word lists, intent verbs, glossary.
- `language/ejochat.ts` — Anthropic-compatible HTTP client.
- `language/kinyarwanda-service.ts` — public KinyarwandaService API
  (`normalizeKinyarwanda`, `understandKinyarwanda`, `explainInKinyarwanda`,
  `summarizeInKinyarwanda`, `generateKinyarwanda`, `improveKinyarwanda`).
- `agent/opencode-agent.ts` — drives `@opencode-ai/sdk-next` OpenCode.
- `agent/context.ts` — lightweight project context (name, file count, branch).
- `config/` — config loading and env override.
- `security/secret.ts` — secret detection and redaction.

## Data flow

```
promptLine (⚡ iCode >)
  └─ detectLanguage / extractIntent
  └─ KinyarwandaService.understandKinyarwanda   (spinner "Ndimo gusesengura...")
  └─ runOpenCodePrompt -> events -> StreamingWriter (text deltas) / spinner (tools)
  └─ KinyarwandaService.explainInKinyarwanda    -> "Igisubizo" box
  └─ success("Byakozwe neza.")
```

## Anti-corruption layer

`token-protector.ts` substitutes placeholders for technical tokens before any
Kinyarwanda processing and restores them afterwards. Combined with
`security/secret.ts` redaction, this guarantees:
- Source code, paths, and commands are never altered by EjoChat.
- Secrets never leave the process.
