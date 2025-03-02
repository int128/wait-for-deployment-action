export class Timer {
  private readonly startedAt: number
  constructor(startedAt: number) {
    this.startedAt = startedAt
  }

  elapsedSeconds(): number {
    return Math.floor((Date.now() - this.startedAt) / 1000)
  }
}

export const startTimer = (): Timer => new Timer(Date.now())

export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
