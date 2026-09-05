import { readdirSync } from "node:fs"
import { basename } from "node:path"
import { execFileSync } from "node:child_process"

export interface ProjectInfo {
  name: string
  fileCount: number
  branch: string
  directory: string
}

function safeGit(dir: string, args: string[]): string {
  try {
    return execFileSync("git", args, { cwd: dir, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim()
  } catch {
    return ""
  }
}

/** Gather lightweight project context without heavy scans. */
export function readProjectInfo(directory: string): ProjectInfo {
  let fileCount = 0
  try {
    fileCount = countProjectFiles(directory, 0)
  } catch {
    fileCount = 0
  }
  const branch = safeGit(directory, ["branch", "--show-current"]) || safeGit(directory, ["rev-parse", "--short", "HEAD"]) || "main"
  return { name: basename(directory) || "umushinga", fileCount, branch, directory }
}

function countProjectFiles(dir: string, depth: number): number {
  if (depth > 6) return 0
  let count = 0
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const name = entry.name
    if (name === "node_modules" || name === ".git" || name.startsWith(".")) continue
    if (entry.isDirectory()) {
      count += countProjectFiles(`${dir}/${name}`, depth + 1)
    } else {
      count++
    }
  }
  return count
}
