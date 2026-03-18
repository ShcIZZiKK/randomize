import { clamp } from '../lib/math'

/**
 * Делает “прокрутку” числа, которая останавливается на финальном значении
 */
export class Roller {
  /** Генератор случайных чисел */
  private readonly pickRandom1to10: () => number

  /**
   * Конструктор класса Roller
   * @param pickRandom1to10 генератор случайных чисел
   */
  constructor(pickRandom1to10: () => number) {
    this.pickRandom1to10 = pickRandom1to10
  }

  /**
   * Запускает анимацию ролла на заданную длительность
   *
   * @param durationMs сколько должна длиться анимация
   * @param onTick вызывается с промежуточными значениями во время анимации
   */
  async roll(durationMs: number, onTick: (n: number) => void): Promise<number> {
    const started = performance.now()
    let last = this.pickRandom1to10()

    onTick(last)

    return await new Promise<number>((resolve) => {
      const tick = () => {
        const time = performance.now() - started
        const progress = clamp(time / durationMs, 0, 1)
        const speed = 1 - progress
        const interval = 40 + speed * 180 // скорость анимации

        if (time >= durationMs) {
          const final = this.pickRandom1to10()
          
          onTick(final)
          resolve(final)

          return
        }

        /**
         * Если случайное число меньше 0.8, то генерируем новое случайное число
         * сделано, чтобы во время “перескакивания” число менялось не на каждом тике, а иногда “задерживалось” на долю секунды
         * так анимация выглядит естественнее
        */
        if (Math.random() < 0.8) {
          last = this.pickRandom1to10()
        }

        onTick(last)

        window.setTimeout(tick, interval)
      }
 
      tick()
    })
  }
}

