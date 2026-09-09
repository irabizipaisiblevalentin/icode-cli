import { Global } from "@opencode-ai/core/global"
import fs from "fs"
import path from "path"
import crypto from "crypto"
import open from "open"
import { getHardwareId } from "./hardware"

// ─── Control Server URL (baked at build time) ─────────────────────────

declare const ICODE_CONTROL_URL: string | undefined
declare const OPENCODE_VERSION: string | undefined

export const CONTROL_URL =
  (typeof ICODE_CONTROL_URL !== "undefined" ? ICODE_CONTROL_URL : undefined) ??
  process.env.ICODE_CONTROL_URL ??
  "https://icode-s05p.onrender.com"

const CLIENT_VERSION =
  typeof OPENCODE_VERSION !== "undefined" && OPENCODE_VERSION ? OPENCODE_VERSION : "0.0.0"

// ─── Local Storage ────────────────────────────────────────────────────

const STORE_PATH = path.join(Global.Path.state, "passcode.json")

interface StoredPasscode {
  machine_id: string
  passcode: string
  passcode_id: string | null
  expires_at: string | null
  validated_at: string
}

function getMachineId(): string {
  const machineIdPath = path.join(Global.Path.state, "machine-id")
  if (fs.existsSync(machineIdPath)) {
    return fs.readFileSync(machineIdPath, "utf8").trim()
  }
  const id = crypto.randomUUID()
  fs.mkdirSync(path.dirname(machineIdPath), { recursive: true })
  fs.writeFileSync(machineIdPath, id, "utf8")
  return id
}

function loadStored(): StoredPasscode | null {
  if (!fs.existsSync(STORE_PATH)) return null
  try {
    return JSON.parse(fs.readFileSync(STORE_PATH, "utf8"))
  } catch {
    return null
  }
}

function storePasscode(data: StoredPasscode): void {
  fs.mkdirSync(path.dirname(STORE_PATH), { recursive: true })
  fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2), "utf8")
}

// ─── Server Communication ─────────────────────────────────────────────

interface ValidateResponse {
  ok: boolean
  reason?: string
  message: string
  passcode_id?: string
  expires_at?: string
  type?: "public" | "personal"
}

interface HeartbeatResponse {
  ok: boolean
  blocked?: boolean
  message?: string
  remaining_seconds?: number
  warn?: boolean
}

interface StatusResponse {
  ok: boolean
  blocked?: boolean
  passcode_valid?: boolean
  passcode_blocked?: boolean
  passcode_expired?: boolean
  expires_at?: string
  type?: string
  message?: string
}

async function serverPost<T>(path: string, body: unknown): Promise<T | null> {
  try {
    const response = await fetch(`${CONTROL_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(5000),
    })
    return await response.json() as T
  } catch {
    return null
  }
}

// ─── Public API ───────────────────────────────────────────────────────

export function getMachineIdForExport(): string {
  return getMachineId()
}

export async function validatePasscode(code: string): Promise<ValidateResponse | null> {
  const machineId = getMachineId()
  return serverPost<ValidateResponse>("/v1/passcode/validate", {
    code,
    machine_id: machineId,
    hardware_id: getHardwareId(),
    platform: process.platform,
    arch: process.arch,
    version: CLIENT_VERSION,
  })
}

export async function sendHeartbeat(secondsActive: number): Promise<HeartbeatResponse | null> {
  const machineId = getMachineId()
  return serverPost<HeartbeatResponse>("/v1/install/heartbeat", {
    machine_id: machineId,
    hardware_id: getHardwareId(),
    seconds_active: secondsActive,
  })
}

export async function checkStatus(): Promise<StatusResponse | null> {
  const machineId = getMachineId()
  return serverPost<StatusResponse>("/v1/install/status", {
    machine_id: machineId,
    hardware_id: getHardwareId(),
  })
}

export function savePasscode(code: string, passcodeId: string | null, expiresAt: string | null): void {
  storePasscode({
    machine_id: getMachineId(),
    passcode: code,
    passcode_id: passcodeId,
    expires_at: expiresAt,
    validated_at: new Date().toISOString(),
  })
}

export function loadPasscode(): StoredPasscode | null {
  return loadStored()
}

export function hasStoredPasscode(): boolean {
  return loadStored() !== null
}

// ─── Enforcement Gate ─────────────────────────────────────────────────

export interface PasscodeStatus {
  allowed: boolean
  blocked: boolean
  warn: boolean
  message: string
}

export async function enforcePasscodeGate(): Promise<PasscodeStatus> {
  const stored = loadPasscode()

  // No passcode stored → prompt required
  if (!stored) {
    return {
      allowed: false,
      blocked: false,
      warn: false,
      message: "No Passcode found. Please enter your Passcode.",
    }
  }

  // Check expiry locally first
  if (stored.expires_at && new Date(stored.expires_at) < new Date()) {
    return {
      allowed: false,
      blocked: true,
      warn: false,
      message: "Your trial has ended.\nTo keep using iCode, pay 1,000 RWF and get a Passcode.\nOpen the browser to continue.",
    }
  }

  // Check with server
  const serverStatus = await checkStatus()
  if (!serverStatus) {
    // Offline grace: allow if validated within last 24 hours
    const validatedAt = new Date(stored.validated_at)
    const hoursSinceValidation = (Date.now() - validatedAt.getTime()) / (1000 * 60 * 60)
    if (hoursSinceValidation < 24) {
      return {
        allowed: true,
        blocked: false,
        warn: true,
        message: "Running offline: your passcode was validated within the last 24 hours.",
      }
    }
    return {
      allowed: false,
      blocked: true,
      warn: false,
      message: "Could not verify the passcode. Please check your internet connection.",
    }
  }

  if (serverStatus.blocked) {
    return {
      allowed: false,
      blocked: true,
      warn: false,
      message: serverStatus.message ?? "This device (installation) has been blocked.",
    }
  }

  if (serverStatus.passcode_blocked) {
    return {
      allowed: false,
      blocked: true,
      warn: false,
      message: serverStatus.message ?? "Your access to iCode has been revoked.\nPlease contact the iCode admin.",
    }
  }

  if (serverStatus.passcode_expired) {
    return {
      allowed: false,
      blocked: true,
      warn: false,
      message: serverStatus.message ?? "Your trial has ended.\nTo keep using iCode, pay 1,000 RWF and get a Passcode.",
    }
  }

  if (!serverStatus.ok || !serverStatus.passcode_valid) {
    return {
      allowed: false,
      blocked: true,
      warn: false,
      message: serverStatus.message ?? "Your Passcode is no longer valid. Please contact support.",
    }
  }

  // Check expiry from server
  if (serverStatus.expires_at && new Date(serverStatus.expires_at) < new Date()) {
    return {
      allowed: false,
      blocked: true,
      warn: false,
      message: "Your trial has ended.\nTo keep using iCode, pay 1,000 RWF and get a Passcode.",
    }
  }

  return {
    allowed: true,
    blocked: false,
    warn: false,
    message: "OK",
  }
}

// ─── Interactive Gate (trial + browser-based passcode entry) ──────────

interface TrialResponse {
  ok: boolean
  trial_active: boolean
  trial_expired: boolean
  already_started: boolean
  expires_at: string | null
  message: string
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// Ask the server for (or report) this machine's one-time free trial.
async function startTrialRequest(): Promise<TrialResponse | null> {
  const machineId = getMachineId()
  return serverPost<TrialResponse>("/v1/trial/start", {
    machine_id: machineId,
    hardware_id: getHardwareId(),
    platform: process.platform,
    arch: process.arch,
    version: CLIENT_VERSION,
  })
}

// Opens the access page (browser) with this machine id so the user can enter
// their paid passcode, then polls until the machine is activated (or timeout).
// On activation it refreshes the locally stored passcode so the stale
// local-expiry check in enforcePasscodeGate does not lock a renewed machine.
async function openAccessWait(timeoutMs = 5 * 60_000): Promise<boolean> {
  const machineId = getMachineId()
  const url = `${CONTROL_URL}/access?machine=${encodeURIComponent(machineId)}`
  console.log("\nOpening your browser so you can enter your Passcode.")
  console.log("Enter the Passcode in the browser, then come back to the terminal.\n")
  await open(url).catch(() => undefined)

  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    const s = await checkStatus()
    if (s?.ok && s.passcode_valid) {
      storePasscode({
        machine_id: machineId,
        passcode: "RENEWED",
        passcode_id: null,
        expires_at: s.expires_at ?? null,
        validated_at: new Date().toISOString(),
      })
      return true
    }
    await sleep(3000)
  }
  return false
}

// Opens a web page confirming the free trial is enabled. Fire-and-forget:
// the terminal session is not blocked — the user can start using iCode right
// away while the browser shows the trial details and the pay reminder.
function showTrialEnabledWeb(expiresAt: string): void {
  const machineId = getMachineId()
  const url = `${CONTROL_URL}/access?machine=${encodeURIComponent(machineId)}&trial_started=1&expires=${encodeURIComponent(expiresAt)}`
  void open(url).catch(() => undefined)
}

// Runs the full licensing gate at CLI startup. Returns true if the user may
// proceed to use iCode, false otherwise (caller should exit).
//
// Flow:
//   1. First run (no stored passcode) → auto-start a free 21-day trial.
//   2. Existing passcode that is expired/blocked, or no trial left → open the
//      browser access page and wait for the machine to be activated.
export async function runPasscodeGate(): Promise<boolean> {
  const stored = loadPasscode()

  if (!stored) {
    // First run: silently start the free trial.
    const trialRes = await startTrialRequest()
    if (!trialRes) {
      console.error("\nCould not reach the iCode server. Check your internet connection and try again.\n")
      return false
    }
    if (trialRes.trial_active && trialRes.expires_at) {
      storePasscode({
        machine_id: getMachineId(),
        passcode: "TRIAL",
        passcode_id: null,
        expires_at: trialRes.expires_at,
        validated_at: new Date().toISOString(),
      })
      const expiresDate = new Date(trialRes.expires_at)
      const remainingMs = expiresDate.getTime() - Date.now()
      const remainingDays = Math.ceil(remainingMs / (1000 * 60 * 60 * 24))
      console.log("\n┌──────────────────────────────────────────┐")
      console.log("│                  iCode                   │")
      console.log("│        iCode Coding Agent               │")
      console.log("└──────────────────────────────────────────┘\n")
      console.log("✓ Welcome to iCode!")
      console.log(`  You have a free 3-week trial.`)
      console.log(`  Trial ends: ${expiresDate.toLocaleDateString()}`)
      console.log(`  Days: ${remainingDays}\n`)
      showTrialEnabledWeb(trialRes.expires_at)
      return true
    }
    console.log(`\n${trialRes.message ?? "No trial available. Please pay to continue."}\n`)
  } else {
    // Re-check an existing passcode.
    const s = await enforcePasscodeGate()
    if (s.allowed) {
      if (s.warn) console.log(`⚠ ${s.message}`)
      return true
    }
    console.log(`\n${s.message}\n`)
  }

  // Trial not available or passcode expired/blocked → browser-based renewal.
  const activated = await openAccessWait()
  if (activated) {
    console.log("\n┌──────────────────────────────────────────┐")
    console.log("│                  iCode                   │")
    console.log("│        iCode Coding Agent               │")
    console.log("└──────────────────────────────────────────┘\n")
    console.log("✓ iCode Access Verified")
    console.log("✓ Welcome to iCode!")
    console.log("✓ You can now continue using iCode.\n")
    return true
  }
  console.error("\nCould not verify your access. Please try again later.\n")
  return false
}

// ─── Heartbeat Loop ───────────────────────────────────────────────────

let heartbeatInterval: ReturnType<typeof setInterval> | null = null

export function startHeartbeat(): void {
  if (heartbeatInterval) return

  let lastBeat = Date.now()
  heartbeatInterval = setInterval(async () => {
    const now = Date.now()
    const secondsActive = (now - lastBeat) / 1000
    lastBeat = now

    const response = await sendHeartbeat(secondsActive)
    if (response?.blocked) {
      console.error("\n⚠ Your session has been blocked. Exiting...\n")
      process.exit(1)
    }
  }, 30_000) // Every 30 seconds
}

export function stopHeartbeat(): void {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval)
    heartbeatInterval = null
  }
}
