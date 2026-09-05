#!/usr/bin/env bun
/**
 * Publishes iCode to npm.
 *
 * Order matters: per-platform binary packages must be published before the
 * @icode/cli metapackage so the optional dependencies resolve.
 *
 * Usage (from packages/icode):
 *   bun run script/publish.ts            # publishes at the current package.json version
 *   npm run package                      # rebuild the npm/* platform packages first
 */
import { $ } from "bun"
import path from "path"

const DIR = path.resolve(import.meta.dirname, "..")
const NPM_DIR = path.join(DIR, "npm")

const platforms = ["icode-linux-x64", "icode-linux-arm64", "icode-darwin-x64", "icode-darwin-arm64", "icode-windows-x64", "icode-windows-arm64"]

for (const platform of platforms) {
  console.log(`>> publishing @vln.codes__/icode-${platform}`)
  await $`npm publish --access public`.cwd(path.join(NPM_DIR, platform))
}

console.log(">> publishing @vln.codes__/icode")
await $`npm publish --access public`.cwd(DIR)

console.log("All packages published.")