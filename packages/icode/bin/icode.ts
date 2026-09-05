#!/usr/bin/env bun
import { runCLI } from "../src/index"

runCLI().catch((error) => {
  process.stderr.write(`Ikibazo cyabaye: ${error instanceof Error ? error.message : String(error)}\n`)
  process.exit(1)
})
