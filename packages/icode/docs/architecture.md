# Architecture

## Design principles

1. **English-first.** UX copy and explanations are in English. Code, syntax,
   identifiers, paths, and commands are never translated.
2. **Two disjoint layers.** `OpenCodeAgent` (the coding engine) is driven
   directly from the middleware in `shell.ts`.
3. **Graceful degradation.** iCode keeps working as a coding agent even when
   no network / provider is available, falling back to clear error messages.

## Module responsibilities

- `cli/renderer.ts` — semantic boxes/status lines; `cli/theme.ts` — glyph
  (Unicode/ASCII) and color detection; `cli/spinner.ts` — single-line animation;
  `cli/prompt.ts` — readline input; `cli/terminal.ts` — dimensions & resize;
  `cli/slashes.ts` — command registry; `cli/danger.ts` — destructive-command
  detection; `cli/shell.ts` — session loop, middleware orchestration.
- `agent/opencode-agent.ts` — drives `@opencode-ai/sdk-next` OpenCode.
- `agent/context.ts` — lightweight project context (name, file count, branch).
- `config/` — config loading and env override.
- `security/secret.ts` — secret detection and redaction.

## Data flow

```
promptLine (⚡ iCode >)
  └─ runOpenCodePrompt -> events -> StreamingWriter (text deltas) / spinner (tools)
  └─ success("Done.")
```

## Security

`security/secret.ts` redaction guarantees:
- Source code, paths, and commands are never altered.
- Secrets never leave the process.
