/**
 * Ограничивает число диапазоном [min, max]
 */
export function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

/**
 * Ограничивает число диапазоном [0, 1]
 */
export function clamp01(n: number) {
  return clamp(n, 0, 1)
}

