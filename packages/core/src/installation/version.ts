declare global {
  const OPENCODE_VERSION: string
  const OPENCODE_CHANNEL: string
  const OPENCODE_COMPAT_VERSION: string
}

export const InstallationVersion = typeof OPENCODE_VERSION === "string" ? OPENCODE_VERSION : "local"
export const InstallationChannel = typeof OPENCODE_CHANNEL === "string" ? OPENCODE_CHANNEL : "local"
export const InstallationLocal = InstallationChannel === "local"

// Product builds (e.g. iCode) rebrand OPENCODE_VERSION, but upstream services
// such as the opencode provider gateway enforce a minimum upstream version.
// Keep the version reported to those services independent of the product
// version so rebranding does not break API compatibility.
export const InstallationCompatVersion =
  typeof OPENCODE_COMPAT_VERSION === "string" ? OPENCODE_COMPAT_VERSION : InstallationVersion
