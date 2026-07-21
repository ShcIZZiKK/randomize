import { describe, expect, it } from 'vitest'
import { rangeMultiplier, resolveBet } from './bets'

describe('rangeMultiplier', () => {
  it('для 1 числа даёт x5', () => {
    expect(rangeMultiplier(1)).toBeCloseTo(5, 5)
  })

  it('для 5 чисел даёт x1.4', () => {
    expect(rangeMultiplier(5)).toBeCloseTo(1.4, 5)
  })

  it('для 10 чисел даёт x1', () => {
    expect(rangeMultiplier(10)).toBeCloseTo(1, 5)
  })

  it('монотонно убывает при росте диапазона', () => {
    const values = Array.from({ length: 10 }, (_, i) => rangeMultiplier(i + 1))
    for (let i = 1; i < values.length; i++) {
      expect(values[i]!).toBeLessThanOrEqual(values[i - 1]!)
    }
  })

  it('клампит count вне 1..10', () => {
    expect(rangeMultiplier(0)).toBeCloseTo(rangeMultiplier(1), 5)
    expect(rangeMultiplier(99)).toBeCloseTo(rangeMultiplier(10), 5)
  })
})

describe('resolveBet', () => {
  it('number: победа только при совпадении', () => {
    expect(resolveBet({ kind: 'number', value: 7, stake: 10 }, 7)).toEqual({
      win: true,
      multiplier: 5,
    })
    expect(resolveBet({ kind: 'number', value: 7, stake: 10 }, 3).win).toBe(false)
  })

  it('gt5 / lt5: число 5 не выигрывает', () => {
    expect(resolveBet({ kind: 'gt5', stake: 10 }, 6).win).toBe(true)
    expect(resolveBet({ kind: 'gt5', stake: 10 }, 5).win).toBe(false)
    expect(resolveBet({ kind: 'lt5', stake: 10 }, 4).win).toBe(true)
    expect(resolveBet({ kind: 'lt5', stake: 10 }, 5).win).toBe(false)
  })

  it('even / odd', () => {
    expect(resolveBet({ kind: 'even', stake: 10 }, 8)).toEqual({ win: true, multiplier: 1.9 })
    expect(resolveBet({ kind: 'odd', stake: 10 }, 3)).toEqual({ win: true, multiplier: 1.9 })
    expect(resolveBet({ kind: 'even', stake: 10 }, 3).win).toBe(false)
  })

  it('prime: выигрывают 2,3,5,7', () => {
    expect(resolveBet({ kind: 'prime', stake: 10 }, 5)).toEqual({ win: true, multiplier: 2.3 })
    expect(resolveBet({ kind: 'prime', stake: 10 }, 1).win).toBe(false)
    expect(resolveBet({ kind: 'prime', stake: 10 }, 9).win).toBe(false)
  })

  it('range: границы включающие, from/to можно в любом порядке', () => {
    const forward = resolveBet({ kind: 'range', from: 2, to: 4, stake: 10 }, 3)
    const reverse = resolveBet({ kind: 'range', from: 4, to: 2, stake: 10 }, 3)

    expect(forward.win).toBe(true)
    expect(reverse.win).toBe(true)
    expect(forward.multiplier).toBeCloseTo(rangeMultiplier(3), 5)
    expect(resolveBet({ kind: 'range', from: 2, to: 4, stake: 10 }, 5).win).toBe(false)
  })
})
