import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Roller } from './Roller'

describe('Roller', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('вызывает onTick и возвращает финальное значение', async () => {
    let call = 0
    const pick = vi.fn(() => {
      call += 1
      return Math.min(call, 10)
    })
    const onTick = vi.fn()
    const roller = new Roller(pick)

    const promise = roller.roll(200, onTick)
    await vi.advanceTimersByTimeAsync(250)
    const result = await promise

    expect(onTick).toHaveBeenCalled()
    expect(result).toBeGreaterThanOrEqual(1)
    expect(result).toBeLessThanOrEqual(10)
    expect(pick).toHaveBeenCalled()
  })

  it('продолжает тикать и завершает ролл за durationMs', async () => {
    const values: number[] = []
    const roller = new Roller(() => 4)

    const promise = roller.roll(120, (n) => values.push(n))
    await vi.runAllTimersAsync()
    const result = await promise

    expect(result).toBe(4)
    expect(values.length).toBeGreaterThan(1)
    expect(values.every((n) => n === 4)).toBe(true)
  })
})
