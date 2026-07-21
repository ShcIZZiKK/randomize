import { describe, expect, it } from 'vitest'
import { clamp, clamp01 } from './math'

describe('clamp', () => {
  it('возвращает значение внутри диапазона без изменений', () => {
    expect(clamp(5, 0, 10)).toBe(5)
  })

  it('ограничивает снизу', () => {
    expect(clamp(-3, 0, 10)).toBe(0)
  })

  it('ограничивает сверху', () => {
    expect(clamp(99, 0, 10)).toBe(10)
  })
})

describe('clamp01', () => {
  it('ограничивает в [0, 1]', () => {
    expect(clamp01(-0.2)).toBe(0)
    expect(clamp01(0.4)).toBe(0.4)
    expect(clamp01(1.8)).toBe(1)
  })
})
