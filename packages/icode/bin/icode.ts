#!/usr/bin/env bun
import { runCLI } from "../src/index"

runCLI().catch((error) => {
  process.stderr.write(`Error: ${error instanceof Error ? error.message : String(error)}\n`)
  process.exit(1)
})
