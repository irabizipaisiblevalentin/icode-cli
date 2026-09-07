# iCode (packages/icode)

**iCode** is a professional terminal-based coding agent built on **OpenCode AI**,
designed from the beginning for **English**-speaking developers.

- **English-first** developer experience (UI, prompts, explanations).
- **EjoChat** as an optional language-intelligence service.
- **OpenCode** remains the coding engine (files, terminal, Git, tools, commands).
- Streams output, slash commands, semantic colors with ASCII/monochrome fallback.

> iCode keeps every technical identifier, file path, command, URL, and code
> snippet exactly as the user wrote them, while explaining in English.

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

On first run you'll be asked to connect an AI provider (`icode providers`).

---

## Architecture

```
src/
  cli/          renderer, prompt, spinner, theme, terminal, slashes, danger, shell
  agent/        opencode (OpenCode SDK driver), context (project info)
  config/       load ~/.config/icode/config.* + env
  security/     secret detection & redaction
  utils/        lightweight config parsers (jsonc/toml/yaml)
```

**Pipeline** (see spec section 5):

```
USER INPUT
  -> OpenCode agent (code/tools)
  -> tool execution
  -> technical result
  -> CLI renderer
```

---

## Setup

Requires [Bun](https://bun.sh) and the workspace-installed dependencies:

```sh
bun install
```

Optional config in `~/.config/icode/config.{json,jsonc,toml,yaml}` — see
`examples/`. All values are overridable via environment variables:

| Variable              | Purpose                                    |
| --------------------- | ------------------------------------------ |
| `EJOCHAT_API_KEY`     | Optional, enables EjoChat summaries        |
| `EJOCHAT_BASE_URL`    | Default `https://api.ejolabs.com/api/v1`   |
| `EJOCHAT_MODEL`       | EjoChat model                              |
| `EJOCHAT_DISABLED`    | `1` to disable EjoChat entirely            |
| `ICODE_LANGUAGE`      | `en` (default and only option)             |
| `ICODE_DEBUG`         | `1` to surface technical errors            |
| `ICODE_ASCII`         | `1` to force ASCII-only glyphs             |
| `ICODE_NO_COLOR`      | `1` to disable color                       |

### EjoChat API contract

This package can optionally integrate with the official **EjoChat** API (by Ejo Labs):

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
⚡ iCode > explain this file
```

Single-shot mode:

```sh
bun run bin/icode.ts "Fix the bug in this code."
```

### Slash commands

| Command             | Meaning                              |
| ------------------- | ------------------------------------ |
| `/help`             | Show all iCode commands.             |
| `/status`           | Show the status of the project.      |
| `/model`            | Show the model in use.               |
| `/language en`      | Set the interface language.          |
| `/config`           | Show where iCode stores its config.  |
| `/clear`            | Clear the terminal.                  |
| `/exit`             | Exit iCode.                          |
| `/version`          | Show the iCode version.              |

---

## Language mode

- **`en`** (default and only option): English UI/explanations. Code, syntax,
  commands, and technical identifiers are never translated.

## Security

- API key is read from the environment only, never printed, never logged, never
  committed, and never sent to EjoChat as content.
- `security/secret.ts` detects and redacts JWT-like tokens, key fields, and
  high-entropy strings before external calls and before display.
- If `EJOCHAT_API_KEY` is missing, iCode prints a warning and continues as a
  normal coding agent — it never crashes (spec section 4).

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
  `src/` (English CLI built on OpenCode), used for development and tests.
  The shipped product is the native binary, not this source.

## Credits

- **iCode** is created by **Irabizi Paisible Valentin**.
- The coding engine and underlying coding workflows are built on the
  **OpenCode** engine (MIT, © 2025 opencode). iCode is not affiliated with the
  OpenCode team. See the repository LICENSE (root and `packages/opencode`).
- **EjoChat** (by Ejo Labs) is used only as an optional language-intelligence
  layer and never runs coding tools.