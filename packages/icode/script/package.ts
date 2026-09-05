#!/usr/bin/env bun
/**
 * Assembles the publishable npm packages for iCode from the compiled native
 * binaries produced by packages/opencode/script/build.ts.
 *
 * Layout (mirrors the esbuild-style native-binary distribution model):
 *   @icode/cli                      metapackage (bin shim + optional deps)
 *   @icode/cli-<os>-<arch>          per-platform native binary package
 *
 * Usage:
 *   bun run script/package.ts [--version 1.0.0]
 */
import { $ } from "bun"
import path from "path"

const DIR = path.resolve(import.meta.dirname, "..")
const DIST = path.resolve(DIR, "../opencode/dist")
const NPM_DIR = path.join(DIR, "npm")
const BIN_DIR = path.join(DIR, "bin")

const versionFlag = process.argv.find((arg) => arg.startsWith("--version="))
const VERSION = versionFlag ? versionFlag.split("=")[1] : "1.0.0"

const SCOPE = "@vln.codes__"

const PLATFORMS = [
  { pkg: `${SCOPE}/icode-linux-x64`, dir: "linux-x64", os: "linux", cpu: "x64" },
  { pkg: `${SCOPE}/icode-linux-arm64`, dir: "linux-arm64", os: "linux", cpu: "arm64" },
  { pkg: `${SCOPE}/icode-darwin-x64`, dir: "darwin-x64", os: "darwin", cpu: "x64" },
  { pkg: `${SCOPE}/icode-darwin-arm64`, dir: "darwin-arm64", os: "darwin", cpu: "arm64" },
  { pkg: `${SCOPE}/icode-windows-x64`, dir: "windows-x64", os: "win32", cpu: "x64", exe: true },
  { pkg: `${SCOPE}/icode-windows-arm64`, dir: "windows-arm64", os: "win32", cpu: "arm64", exe: true },
]

await $`rm -rf ${NPM_DIR}`
await $`mkdir -p ${NPM_DIR} ${BIN_DIR}`

const binName = (exe?: boolean) => (exe ? "icode.exe" : "icode")
const binEntry = (exe?: boolean) => (exe ? "bin/icode.exe" : "bin/icode")

const optionalDeps: Record<string, string> = {}

for (const platform of PLATFORMS) {
  const dest = path.join(NPM_DIR, platform.pkg.replace(`${SCOPE}/`, ""))
  const binDir = path.join(dest, "bin")
  await $`mkdir -p ${binDir}`

  const srcBin = path.join(DIST, `icode-${platform.dir}`, "bin", binName(platform.exe))
  await $`cp ${srcBin} ${binDir}/${binName(platform.exe)}`
  await $`chmod +x ${binDir}/${binName(platform.exe)}`

  await Bun.write(
    path.join(dest, "package.json"),
    JSON.stringify(
      {
        name: platform.pkg,
        version: VERSION,
        description: "The native iCode binary for " + `${platform.os}-${platform.cpu}`,
        license: "MIT",
        preferUnplugged: true,
        os: [platform.os],
        cpu: [platform.cpu],
        bin: { icode: binEntry(platform.exe) },
        files: ["bin"],
      },
      null,
      2,
    ),
  )

  optionalDeps[platform.pkg] = VERSION
}

await Bun.write(
  path.join(DIR, "manifest.json"),
  JSON.stringify({ version: VERSION, optionalDependencies: optionalDeps }, null, 2),
)

console.log(`Assembled ${PLATFORMS.length} platform packages at ${path.relative(DIR, NPM_DIR)}`)
console.log(`optionalDependencies:`)
for (const [name, version] of Object.entries(optionalDeps)) console.log(`  ${name}@${version}`)
