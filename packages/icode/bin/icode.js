#!/usr/bin/env node
import { spawn } from "node:child_process"
import { createRequire } from "node:module"
import { fileURLToPath } from "node:url"
import path from "node:path"

const require = createRequire(import.meta.url)
const binDir = path.dirname(fileURLToPath(import.meta.url))

const KNOWN = {
  "linux-x64": "@vln.codes__/icode-linux-x64",
  "linux-arm64": "@vln.codes__/icode-linux-arm64",
  "darwin-x64": "@vln.codes__/icode-darwin-x64",
  "darwin-arm64": "@vln.codes__/icode-darwin-arm64",
  "win32-x64": "@vln.codes__/icode-windows-x64",
  "win32-arm64": "@vln.codes__/icode-windows-arm64",
}

const key = `${process.platform}-${process.arch}`
const pkg = KNOWN[key]

if (!pkg) {
  console.error(
    `iCode does not support ${process.platform}-${process.arch} yet.\n` +
      `Supported platforms: ${Object.keys(KNOWN).join(", ")}`,
  )
  process.exit(1)
}

let bin
try {
  const binName = process.platform === "win32" ? "icode.exe" : "icode"
  bin = require.resolve(`${pkg}/bin/${binName}`, { paths: [binDir, process.cwd()] })
} catch {
  console.error(
    `iCode native binary for ${key} (${pkg}) is not installed.\n` +
      `This usually means the optional dependency was skipped. Run:\n` +
      `  npm install -g @vln.codes__/icode --force\n` +
      `or reinstall @vln.codes__/icode so the matching platform package is fetched.`,
  )
  process.exit(1)
}

const child = spawn(bin, process.argv.slice(2), { stdio: "inherit", windowsHide: true })

child.on("error", (error) => {
  console.error(`iCode failed to launch: ${error.message}`)
  process.exit(1)
})

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal)
    return
  }
  process.exit(code ?? 0)
})
