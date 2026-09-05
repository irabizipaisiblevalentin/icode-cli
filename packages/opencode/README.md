# iCode

iCode is a Kinyarwanda-first AI coding agent built on the OpenCode engine.
It reads, writes, edits, runs commands, and searches your code — and speaks
Kinyarwanda by default.

- **Kinyarwanda-first**: the interface and prompts default to Kinyarwanda
  (`/language rw|en|auto`).
- **EjoChat intelligence**: set `EJOCHAT_API_KEY` to enable Kinyarwanda
  language understanding and summaries. EjoChat never runs coding tools and
  never sees your API keys.
- **Fully offline-capable coding core**: files, terminal, Git, and code
  generation stay covered by the local engine.

## Install

```bash
bun install
bun dev
```

## Run

```bash
# Interactive TUI (default)
bun --cwd packages/opencode --conditions=browser src/index.ts

# Single prompt
icode run "Kosha bug muri src/main.ts"

# Set your interface language
/language rw|en|auto
```

Config lives in `~/.config/icode`. The environment variable `ICODE_CONFIG_DIR`
overrides the config directory.

## Credits

iCode is created by **Irabizi Paisible Valentin** and is built on the
OpenCode engine (MIT, © 2025 opencode). See the repository LICENSE.