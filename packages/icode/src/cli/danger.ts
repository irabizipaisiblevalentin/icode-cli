const DANGEROUS_PATTERNS: RegExp[] = [
  /\brm\s+-[a-z]*r[a-z]*f/i,
  /\bmv\s+[^\s]+\s+[^\s]+/i,
  /\br?mdir\s+/i,
  /\bgit\s+(push|reset|clean|restore)\s+.*(--force|-f)\b/i,
  /\bgit\s+checkout\s+--\s+/i,
  /\b(?:truncate|dd|mkfs|fdisk|parted)\b/i,
  /\bshutdown|reboot|poweroff\b/i,
  /\bchmod\s+-R\b/i,
  /\bchown\s+-R\b/i,
  /\b:?\s*>\s*\/\w+/,
  /\bfind\s+.*\s-delete\b/i,
  /\buninstall|purge\b/i,
]

/** Detect potentially destructive/dangerous commands for confirmation (spec 10). */
export function isDangerousCommand(command: string): boolean {
  return DANGEROUS_PATTERNS.some((pattern) => pattern.test(command))
}
