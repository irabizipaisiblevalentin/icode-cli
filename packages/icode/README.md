# iCode (packages/icode)

**iCode** is a professional terminal-based coding agent built on **OpenCode AI**,
designed from the beginning for **Kinyarwanda** speakers.

- **Kinyarwanda-first** developer experience (UI, prompts, explanations).
- **EjoChat** as a dedicated Kinyarwanda language-intelligence service.
- **OpenCode** remains the coding engine (files, terminal, Git, tools, commands).
- Streams output, slash commands, semantic colors with ASCII/monochrome fallback.

> iCode is not "English software translated into Kinyarwanda". It is a developer
> tool designed natively for Kinyarwanda speakers, while keeping all technical
> code, syntax, identifiers, paths, and commands unchanged.

---

## Install

`iCode` ships as a **fast native binary** on npm, distributed per-platform
(via optional dependencies, the same model as `esbuild`). Install it globally:

```sh
npm install -g @vln.codes__/icode
```

Then run `icode` from anywhere:

```sh
icode            # start the interactive TUI
icode "help me refactor login"   # one-shot prompt
icode --help
```

> The bare `icode` name and the `@icode` scope are reserved on npm, so the
> published package is `@vln.codes__/icode`. It installs the native `icode`
> command.

**Supported platforms** (native binary, no Node/Bun runtime needed):

| OS | Architecture |
|----|--------------|
| Linux | x64, arm64 |
| macOS (Darwin) | x64, arm64 |
| Windows | x64, arm64 |

On first run you'll be asked to connect an AI provider (`icode providers`)
and, optionally, set an EjoChat API key for Kinyarwanda language intelligence.

---

## Architecture

```
src/
  cli/          renderer, prompt, spinner, theme, terminal, slashes, danger, shell
  language/     kinyarwanda (dictionaries), detector, token-protector,
                ejochat (Anthropic-compatible client), kinyarwanda-service
  agent/        opencode (OpenCode SDK driver), context (project info)
  config/       load ~/.config/icode/config.* + env
  security/     secret detection & redaction
  utils/        lightweight config parsers (jsonc/toml/yaml)
```

**Pipeline** (see spec section 5):

```
USER INPUT
  -> language detection
  -> Kinyarwanda understanding (EjoChat)
  -> intent extraction
  -> OpenCode agent (code/tools)
  -> tool execution
  -> technical result
  -> EjoChat Kinyarwanda explanation
  -> CLI renderer
```

**The rule that matters:** EjoChat is the *language-intelligence* layer only. It
never runs coding tools. OpenCode owns the coding engine. Every string sent to
EjoChat passes through token protection and secret redaction, so technical
tokens are never corrupted and secrets are never exposed.

---

## Setup

Requires [Bun](https://bun.sh) and the workspace-installed dependencies:

```sh
bun install
```

Provide the EjoChat key (never hard-coded, never committed):

```sh
export EJOCHAT_API_KEY=ejochat_your_key_here
```

Optional config in `~/.config/icode/config.{json,jsonc,toml,yaml}` — see
`examples/`. All values are overridable via environment variables:

| Variable              | Purpose                                    |
| --------------------- | ------------------------------------------ |
| `EJOCHAT_API_KEY`     | Required for Kinyarwanda intelligence      |
| `EJOCHAT_BASE_URL`    | Default `https://api.ejolabs.com/api/v1`   |
| `EJOCHAT_MODEL`       | EjoChat model                              |
| `EJOCHAT_DISABLED`    | `1` to disable EjoChat entirely            |
| `ICODE_LANGUAGE`      | `rw` (default) \| `auto` \| `en`           |
| `ICODE_DEBUG`         | `1` to surface technical errors            |
| `ICODE_ASCII`         | `1` to force ASCII-only glyphs             |
| `ICODE_NO_COLOR`      | `1` to disable color                       |

### EjoChat API contract

This package integrates with the official **EjoChat** API (by Ejo Labs):

- Endpoint: `POST https://api.ejolabs.com/api/v1/subiza` (configurable via
  `EJOCHAT_BASE_URL`; the `/subiza` path is appended automatically).
- Auth: `X-API-Key` header (an `ejochat_...` or `kgpt_...` key). The key is
  only ever sent in request headers — never in the body, logs, or prompts.
- Body: OpenAI-style `{ "model", "messages": [{ role, content }] }`; an
  optional system prompt is injected as the first `system` message.
- The library parses several common response shapes
  (`choices[].message.content`, `content[].text`, and plain `text`/`answer`).


---

## Usage

```sh
bun run bin/icode.ts
```

Interactive prompt:

```
⚡ iCode > sobanura iyi dosiye
```

Single-shot mode:

```sh
bun run bin/icode.ts "Kosora ikibazo kiri muri iyi code."
```

### Slash commands (English names, Kinyarwanda descriptions)

| Command             | Meaning (Kinyarwanda)                  |
| ------------------- | -------------------------------------- |
| `/help`             | Erekana amabwiriza yose ya iCode.      |
| `/status`           | Erekana uko umushinga umeze.           |
| `/model`            | Reba model ikoreshwa.                  |
| `/language rw\|auto\|en` | Hitamo ururimi.                  |
| `/config`           | Reba ahantu iCode ibitswe config.      |
| `/clear`            | Siba ibyo bigaragara kuri terminal.    |
| `/exit`             | Sohoka muri iCode.                     |
| `/version`          | Erekana version ya iCode.              |

---

## Language modes

- **`rw`** (default): UI and explanations in Kinyarwanda; code/syntax/commands
  unchanged.
- **`auto`**: detects whether the input is Kinyarwanda.
- **`en`**: English UI/explanations.

## Security

- API key is read from the environment only, never printed, never logged, never
  committed, and never sent to EjoChat as content.
- `security/secret.ts` detects and redacts JWT-like tokens, key fields, and
  high-entropy strings before external calls and before display.
- If `EJOCHAT_API_KEY` is missing, iCode prints a warning and continues as a
  normal coding agent — it never crashes (spec section 4).

## Technical token protection

`language/token-protector.ts` protects file paths, URLs, code blocks, inline
code, commands, env vars, and identifiers before Kinyarwanda processing, then
restores them — so language processing can never corrupt code or paths.

## Testing

```sh
bun test
bun typecheck   # tsgo
```

## Package notes

- Published package `@vln.codes__/icode` (native `icode` command). The `npm`
  tarball ships a small cross-platform `bin/icode.js` launcher plus per-platform
  native binaries as optional dependencies (`@vln.codes__/icode-linux-x64`,
  `@vln.codes__/icode-linux-arm64`, `@vln.codes__/icode-darwin-x64`,
  `@vln.codes__/icode-darwin-arm64`, `@vln.codes__/icode-windows-x64`,
  `@vln.codes__/icode-windows-arm64`).
- Build the binaries from `packages/opencode` (`bun run script/build.ts`), then
  assemble the npm packages with `bun run script/package.ts --version=<ver>`
  from this directory.
- The repo also keeps a self-contained TypeScript reference implementation under
  `src/` (Kinyarwanda CLI built on OpenCode), used for development and tests.
  The shipped product is the native binary, not this source.

## Credits

- **iCode** is created by **Irabizi Paisible Valentin**.
- The coding engine and underlying coding workflows are built on the
  **OpenCode** engine (MIT, © 2025 opencode). iCode is not affiliated with the
  OpenCode team. See the repository LICENSE (root and `packages/opencode`).
- **EjoChat** (by Ejo Labs) is used only as a Kinyarwanda language-intelligence
  layer and never runs coding tools.
