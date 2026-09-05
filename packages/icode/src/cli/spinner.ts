import type { Theme } from "./theme"

const SPINNER_FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"]
const ASCII_FRAMES = ["|", "/", "-", "\\"]

export interface SpinnerOptions {
  theme: Theme
  out: (text: string) => void
  intervalMs?: number
  writeRaw?: (text: string) => void
}

/**
 * A minimal single-line spinner. Uses terminal carriage-return to redraw the
 * current line, and stops cleanly when stop() is called.
 */
export class Spinner {
  private frames: string[]
  private index = 0
  private timer: ReturnType<typeof setInterval> | null = null
  private message = ""
  private out: (text: string) => void
  private writeRaw: (text: string) => void

  constructor(private readonly options: SpinnerOptions) {
    const unicode = options.theme.glyphs.working === "⠋"
    this.frames = unicode ? SPINNER_FRAMES : ASCII_FRAMES
    this.out = options.out
    this.writeRaw = options.writeRaw ?? options.out
  }

  /** Start animating the given message. */
  start(message: string): void {
    this.message = message
    this.index = 0
    // Live in TTY only; otherwise print once and stop.
    if (!process.stdout?.isTTY || !this.options.theme.color) {
      this.writeRaw(`${message}\n`)
      return
    }
    this.stop()
    this.timer = setInterval(() => this.render(), this.options.intervalMs ?? 90)
    this.render()
  }

  update(message: string): void {
    this.message = message
  }

  private render(): void {
    const frame = this.frames[this.index % this.frames.length]!
    this.index++
    this.writeRaw(`\r${frame} ${this.message}\u001b[K`)
  }

  /** Stop animating and clear the spinner line. */
  stop(): void {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
    this.writeRaw("\r\u001b[K")
  }
}
