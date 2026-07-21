import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { BetEngine } from './BetEngine'
import type { EngineDeps } from './BetEngine'
import { Roller } from './Roller'

function createDeps(overrides: Partial<EngineDeps> = {}): EngineDeps {
  return {
    roller: new Roller(() => 7),
    onRender: vi.fn(),
    onMessage: vi.fn(),
    onRollSub: vi.fn(),
    onCharacterAnim: vi.fn(),
    onRollValue: vi.fn(),
    onPhase: vi.fn(),
    onBetPlaced: vi.fn(),
    ...overrides,
  }
}

describe('BetEngine (unit)', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('reset возвращает начальное состояние', () => {
    const deps = createDeps()
    const engine = new BetEngine(deps)

    engine.balance = 50
    engine.selectedBet = { kind: 'even' }
    engine.lastRolled = 4
    engine.reset()

    expect(engine.balance).toBe(1000)
    expect(engine.selectedBet).toBeNull()
    expect(engine.lastRolled).toBeNull()
    expect(engine.phase).toBe('idle')
    expect(deps.onCharacterAnim).toHaveBeenCalledWith('idle')
    expect(deps.onPhase).toHaveBeenCalledWith('idle')
  })

  it('setSelectedBet сохраняет выбор и очищает сообщение', () => {
    const deps = createDeps()
    const engine = new BetEngine(deps)

    engine.setSelectedBet({ kind: 'gt5' })

    expect(engine.selectedBet).toEqual({ kind: 'gt5' })
    expect(deps.onMessage).toHaveBeenCalledWith('', 'neutral')
    expect(deps.onRender).toHaveBeenCalled()
  })

  it('placeBet отклоняет нулевую ставку', async () => {
    const deps = createDeps()
    const engine = new BetEngine(deps)
    engine.setSelectedBet({ kind: 'gt5' })

    await engine.placeBet(0)

    expect(deps.onMessage).toHaveBeenCalledWith('Введите ставку больше нуля.', 'bad')
    expect(deps.onBetPlaced).not.toHaveBeenCalled()
    expect(engine.phase).toBe('idle')
  })

  it('placeBet отклоняет ставку больше баланса', async () => {
    const deps = createDeps()
    const engine = new BetEngine(deps)
    engine.setSelectedBet({ kind: 'gt5' })

    await engine.placeBet(5000)

    expect(deps.onMessage).toHaveBeenCalledWith('Недостаточно средств для ставки.', 'bad')
  })

  it('placeBet отклоняет отсутствие выбора', async () => {
    const deps = createDeps()
    const engine = new BetEngine(deps)

    await engine.placeBet(10)

    expect(deps.onMessage).toHaveBeenCalledWith('Выберите тип ставки.', 'bad')
  })

  it('placeBet на победе увеличивает баланс и ставит win-анимацию', async () => {
    const deps = createDeps({ roller: new Roller(() => 7) })
    const engine = new BetEngine(deps)
    engine.setSelectedBet({ kind: 'number', value: 7 })

    const promise = engine.placeBet(100)
    await vi.advanceTimersByTimeAsync(3000)
    await promise

    // 1000 - 100 + 100*5 = 1400
    expect(engine.balance).toBe(1400)
    expect(deps.onCharacterAnim).toHaveBeenCalledWith('think')
    expect(deps.onCharacterAnim).toHaveBeenCalledWith('win')
    expect(deps.onPhase).toHaveBeenCalledWith('rolling')
    expect(deps.onPhase).toHaveBeenCalledWith('result')
    expect(deps.onBetPlaced).toHaveBeenCalled()
    expect(deps.onMessage).toHaveBeenCalledWith('Победа! Выплата: 500.00 ₽', 'good')
  })

  it('placeBet на поражении ставит lose-анимацию', async () => {
    const deps = createDeps({ roller: new Roller(() => 2) })
    const engine = new BetEngine(deps)
    engine.setSelectedBet({ kind: 'number', value: 7 })

    const promise = engine.placeBet(100)
    await vi.advanceTimersByTimeAsync(3000)
    await promise

    expect(engine.balance).toBe(900)
    expect(deps.onCharacterAnim).toHaveBeenCalledWith('lose')
    expect(deps.onMessage).toHaveBeenCalledWith('Поражение. Попробуйте ещё раз.', 'bad')
  })

  it('после результата через timeout возвращается в idle', async () => {
    const deps = createDeps({ roller: new Roller(() => 2) })
    const engine = new BetEngine(deps)
    engine.setSelectedBet({ kind: 'odd' })

    const promise = engine.placeBet(10)
    await vi.advanceTimersByTimeAsync(3000)
    await promise

    expect(engine.phase).toBe('result')

    await vi.advanceTimersByTimeAsync(1800)
    expect(engine.phase).toBe('idle')
    expect(deps.onCharacterAnim).toHaveBeenCalledWith('idle')
  })
})
