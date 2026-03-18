import { clamp } from '../lib/math'

/**
 * Все поддерживаемые варианты ставок
 *
 * Примечания:
 * - `stake` всегда положительное число
 * - Ставка-диапазон использует включающие границы: from..to
 */
export type Bet =
  | { kind: 'number'; value: number; stake: number }
  | { kind: 'gt5'; stake: number }
  | { kind: 'lt5'; stake: number }
  | { kind: 'even'; stake: number }
  | { kind: 'odd'; stake: number }
  | { kind: 'prime'; stake: number }
  | { kind: 'range'; from: number; to: number; stake: number }

/**
 * Выбор ставки без размера (выбор в UI)
 */
export type SelectedBet =
  | { kind: 'number'; value: number }
  | { kind: 'gt5' }
  | { kind: 'lt5' }
  | { kind: 'even' }
  | { kind: 'odd' }
  | { kind: 'prime' }
  | { kind: 'range'; from: number; to: number }

export type BetResolution = {
  /** Победа ли ставка для выпавшего числа */
  win: boolean
  /** Множитель выплаты, применяемый к ставке при победе */
  multiplier: number
}

/**
 * Для ставки-диапазона используем монотонное отображение:
 * - покрывает 1 число => x5
 * - покрывает 5 чисел => x1.5
 * - покрывает 10 чисел => x1
 *
 * Сделано “ступенчато-плавно” через две линейные части:
 * - от 1 до 5 чисел: x5 → x1.5
 * - от 5 до 10 чисел: x1.5 → x1
 */
export function rangeMultiplier(count: number) {
  const c = clamp(Math.floor(count), 1, 10)

  if (c <= 5) {
    // 1..5: 5 -> 1.5
    const t = (c - 1) / 4 // 0..1

    return 5 + (1.4 - 5) * t
  }

  // 5..10: 1.5 -> 1
  const t = (c - 5) / 5 // 0..1

  return 1.4 + (1 - 1.4) * t
}

/**
 * Определяет исход (win/lose) и множитель выплаты для пары ставка/выпавшее число
 */
export function resolveBet(bet: Bet, rolled: number): BetResolution {
  switch (bet.kind) {
    case 'number':
      return { win: rolled === bet.value, multiplier: 5 }
    case 'gt5':
      return { win: rolled > 5, multiplier: 1.5 }
    case 'lt5':
      return { win: rolled < 5, multiplier: 1.5 }
    case 'even':
      return { win: rolled % 2 === 0, multiplier: 1.9 }
    case 'odd':
      return { win: rolled % 2 === 1, multiplier: 1.9 }
    case 'prime':
      return { win: [2, 3, 5, 7].includes(rolled), multiplier: 2.3 }
    case 'range': {
      const from = Math.min(bet.from, bet.to)
      const to = Math.max(bet.from, bet.to)
      const count = to - from + 1

      return { win: rolled >= from && rolled <= to, multiplier: rangeMultiplier(count) }
    }
  }
}

