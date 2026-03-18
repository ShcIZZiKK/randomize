import { clamp } from '../lib/math'
import { formatMoney } from '../lib/money'
import type { Bet, SelectedBet } from './bets'
import { resolveBet } from './bets'
import { Roller } from './Roller'

export type GamePhase = 'idle' | 'rolling' | 'result'

export type EngineDeps = {
  /** Генератор случайных чисел */
  roller: Roller
  /** Вызывается, когда UI нужно перерисовать */
  onRender: () => void
  /** Вызывается, чтобы показать пользователю сообщение */
  onMessage: (message: string, variant: 'good' | 'bad' | 'neutral') => void
  /** Вызывается, когда нужно поменять подпись под числом */
  onRollSub: (text: string) => void
  /** Вызывается, когда нужно переключить анимацию персонажа */
  onCharacterAnim: (key: 'idle' | 'think' | 'win' | 'lose') => void
  /** Вызывается на каждом тике ролла (включая финальное значение) */
  onRollValue: (n: number | null) => void
  /** Вызывается при смене фазы (чтобы заблокировать/разблокировать UI) */
  onPhase: (phase: GamePhase) => void
  /** Вызывается, когда ставка успешно принята (например, чтобы закрыть drawer) */
  onBetPlaced?: () => void
}

/**
 * Чистый игровой контроллер: хранит баланс, выбранную ставку и запускает игровой цикл
 */
export class BetEngine {
  phase: GamePhase = 'idle'
  balance = 1000
  selectedBet: SelectedBet | null = null
  lastRolled: number | null = null

  private readonly deps: EngineDeps

  constructor(deps: EngineDeps) {
    this.deps = deps
  }

  /**
   * Сбрасывает игру в начальное состояние
   */
  reset() {
    this.balance = 1000
    this.selectedBet = null
    this.lastRolled = null
    this.deps.onMessage('', 'neutral')
    this.deps.onRollSub('Выберите ставку и нажмите “Ставка”')
    this.deps.onCharacterAnim('idle')
    this.setPhase('idle')
    this.deps.onRollValue(null)
    this.deps.onRender()
  }

  /**
   * Выбирает тип ставки (без размера ставки)
   */
  setSelectedBet(next: SelectedBet) {
    this.selectedBet = next
    this.deps.onMessage('', 'neutral')
    this.deps.onRender()
  }

  /**
   * Запускает полный цикл ставки:
   * - валидирует размер ставки и выбор
   * - крутит “рандомизацию” несколько секунд
   * - определяет победу/поражение и обновляет баланс
   */
  async placeBet(stake: number) {
    const bet = this.ensureBet(stake)

    if (!bet) {
      return
    }

    this.deps.onBetPlaced?.()
    this.setPhase('rolling')

    this.balance = clamp(this.balance - bet.stake, 0, 1_000_000_000)
    this.deps.onMessage('', 'neutral')
    this.deps.onRollSub('Рандомизация...')
    this.deps.onRender()

    this.deps.onCharacterAnim('think')

    /** Крутим ролик */
    const rolled = await this.deps.roller.roll(2600, (n) => {
      this.lastRolled = n
      this.deps.onRollValue(n)
      this.deps.onRender()
    })

    const { win, multiplier } = resolveBet(bet, rolled)

    if (win) {
      const payout = bet.stake * multiplier
      this.balance = clamp(this.balance + payout, 0, 1_000_000_000)
      this.deps.onMessage(`Победа! Выплата: ${formatMoney(payout)} ₽`, 'good')
      this.deps.onRollSub(`Выигрыш x${multiplier}`)
      this.deps.onCharacterAnim('win')
    } else {
      this.deps.onMessage('Поражение. Попробуйте ещё раз.', 'bad')
      this.deps.onRollSub('Не повезло')
      this.deps.onCharacterAnim('lose')
    }

    this.deps.onRender()
    this.setPhase('result')

    window.setTimeout(() => {
      if (this.phase !== 'result') {
        return
      }

      this.deps.onCharacterAnim('idle')
      this.deps.onRollSub('Выберите ставку и нажмите “Ставка”')
      this.setPhase('idle')
    }, 1800)
  }

  /**
   * Устанавливает фазу игры
   */
  private setPhase(next: GamePhase) {
    this.phase = next
    this.deps.onPhase(next)
  }

  /**
   * Валидирует размер ставки + выбор и возвращает конкретный `Bet`
   */
  private ensureBet(stake: number): Bet | null {
    if (stake <= 0) {
      this.deps.onMessage('Введите ставку больше нуля.', 'bad')

      return null
    }
    if (stake > this.balance) {
      this.deps.onMessage('Недостаточно средств для ставки.', 'bad')

      return null
    }
    if (!this.selectedBet) {
      this.deps.onMessage('Выберите тип ставки.', 'bad')

      return null
    }
    
    return { ...this.selectedBet, stake } as Bet
  }
}

