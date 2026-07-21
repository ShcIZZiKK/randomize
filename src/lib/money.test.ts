import { describe, expect, it } from 'vitest'
import { formatMoney } from './money'

describe('formatMoney', () => {
  it('форматирует число с двумя знаками после запятой', () => {
    expect(formatMoney(10)).toBe('10.00')
    expect(formatMoney(12.5)).toBe('12.50')
    expect(formatMoney(3.14159)).toBe('3.14')
  })
})
