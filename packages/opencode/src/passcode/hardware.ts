import { createHash } from "crypto"
import { spawnSync } from "node:child_process"
import fs from "fs"

// ─── Hardware fingerprint ──────────────────────────────────────────────
//
// Computes a stable per-PC identifier directly from the machine's hardware /
// firmware, so it survives a full uninstall + reinstall of iCode (unlike the
// state folder, which the user can delete to reset `machine-id`).
//
// The value is never stored on disk: it is derived fresh on every launch, so
// there is nothing the user can erase to "forget" that their trial started.

function run(cmd: string, args: string[]): string {
  try {
    const result = spawnSync(cmd, args, { encoding: "utf8", timeout: 2000 })
    return (result.stdout ?? "").trim()
  } catch {
    return ""
  }
}

function readFileSafe(filePath: string): string {
  try {
    return fs.readFileSync(filePath, "utf8").trim()
  } catch {
    return ""
  }
}

export function getHardwareId(): string {
  let parts: string[] = []
  const platform = process.platform

  if (platform === "linux") {
    const dmi = "/sys/class/dmi/id"
    parts = [
      readFileSafe(`${dmi}/product_uuid`),
      readFileSafe(`${dmi}/board_serial`),
      readFileSafe(`${dmi}/product_name`),
      readFileSafe("/etc/machine-id"),
    ]
  } else if (platform === "darwin") {
    const ioreg = run("ioreg", ["-rd1", "-c", "IOPlatformExpertDevice"])
    parts = [
      run("sysctl", ["-n", "hw.model"]),
      ioreg.match(/IOPlatformSerialNumber" = "([^"]+)"/)?.[1] ?? "",
      ioreg.match(/IOPlatformUUID" = "([^"]+)"/)?.[1] ?? "",
    ]
  } else if (platform === "win32") {
    parts = [run("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command", "(Get-CimInstance Win32_ComputerSystemProduct).UUID"])]
  }

  const joined = parts.join("|").trim()
  if (!joined) return ""
  return createHash("sha256").update(joined).digest("hex").slice(0, 32)
}