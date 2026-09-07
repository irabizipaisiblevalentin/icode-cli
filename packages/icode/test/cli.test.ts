import { expect, test } from "bun:test"
import { createTheme, detectGlyphSupport, countAnsiLength } from "../src/cli/theme"
import { parseSlash, isLanguageArg, SLASH_COMMANDS, languageLabel } from "../src/cli/slashes"
import { isDangerousCommand } from "../src/cli/danger"

test("ASCII fallback when ICODE_ASCII is set", () => {
  const theme = createTheme({ ICODE_ASCII: "1" })
  expect(theme.glyphs.dialog.tl).toBe("+")
  expect(theme.glyphs.success).toBe("OK")
})

test("Unicode glyphs by default", () => {
  const theme = createTheme({})
  expect(theme.glyphs.dialog.tl).toBe("╭")
  expect(theme.glyphs.success).toBe("✓")
})

test("colors disabled with NO_COLOR", () => {
  const theme = createTheme({ NO_COLOR: "1" })
  expect(theme.color).toBe(false)
  expect(theme.paint("x", "31")).toBe("x")
})

test("detectGlyphSupport respects TERM=dumb", () => {
  expect(detectGlyphSupport({ TERM: "dumb" })).toBe(false)
})

test("countAnsiLength ignores ANSI codes", () => {
  const theme = createTheme({})
  expect(countAnsiLength(theme.paint("hello", "31"))).toBe(5)
})

test("parseSlash recognizes commands and args", () => {
  expect(parseSlash("/help extra")).toEqual({ name: "help", arg: "extra" })
  expect(parseSlash("/clear")?.name).toBe("clear")
  expect(parseSlash("just a normal hi")).toBeNull()
  expect(parseSlash("/unknowncmd")?.name).toBeUndefined()
})

test("isLanguageArg and languageLabel", () => {
  expect(isLanguageArg("en")).toBe(true)
  expect(isLanguageArg("fr")).toBe(false)
  expect(languageLabel("en")).toBe("English")
})

test("SLASH_COMMANDS are all described in English", () => {
  for (const cmd of SLASH_COMMANDS) {
    expect(cmd.description.length).toBeGreaterThan(0)
  }
  const exit = SLASH_COMMANDS.find((c) => c.name === "exit")!
  expect(exit.description).toBe("Exit iCode.")
})

test("dangerous command detection", () => {
  expect(isDangerousCommand("rm -rf build")).toBe(true)
  expect(isDangerousCommand("git push --force")).toBe(true)
  expect(isDangerousCommand("npm test")).toBe(false)
})
