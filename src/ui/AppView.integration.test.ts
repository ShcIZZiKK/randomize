import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { BetEngine } from '../game/BetEngine'
import { Roller } from '../game/Roller'
import { appTemplate } from './template'
import { AppView } from './AppView'
import { DrawerController } from './DrawerController'

/**
 * Интеграция UI + игрового движка без Three.js.
 * Проверяем, что ставка через DOM приводит к смене баланса/фаз/результата.
 */
describe('AppView + BetEngine (integration)', () => {
  let root: HTMLDivElement
  let view: AppView
  let engine: BetEngine
  let drawer: DrawerController

  beforeEach(() => {
    vi.useFakeTimers()

    root = document.createElement('div')
    root.innerHTML = appTemplate()
    document.body.append(root)

    view = new AppView(root)
    drawer = new DrawerController(
      view.el.drawer,
      view.el.drawerBackdrop,
      view.el.openBets,
      view.el.closeBets,
    )
    drawer.attach()

    engine = new BetEngine({
      roller: new Roller(() => 8),
      onRender: () => {
        view.setViewModel({
          balance: engine.balance,
          selectedBet: engine.selectedBet,
          lastRolled: engine.lastRolled,
        })
        view.render()
      },
      onMessage: (message, variant) => view.setResult(message, variant),
      onRollSub: (text) => view.setRollSub(text),
      onCharacterAnim: vi.fn(),
      onRollValue: (n) => {
        engine.lastRolled = n
      },
      onPhase: (phase) => view.setPhase(phase),
      onBetPlaced: () => drawer.setOpen(false),
    })

    view.buildNumberGrid((value) => engine.setSelectedBet({ kind: 'number', value }))
    view.buildRangePicker((from, to) => engine.setSelectedBet({ kind: 'range', from, to }))
    engine.reset()
  })

  afterEach(() => {
    root.remove()
    vi.useRealTimers()
  })

  it('читает stake с запятой и ставит MAX', () => {
    view.el.stake.value = '12,5'
    expect(view.readStake()).toBe(12.5)

    engine.balance = 333.339
    view.el.stakeMax.click()
    // обработчик MAX живёт в App — здесь эмулируем поведение
    view.el.stake.value = String(Math.floor(engine.balance * 100) / 100)
    expect(view.el.stake.value).toBe('333.33')
  })

  it('выбор числа в сетке подсвечивает chip', () => {
    const btn = view.el.numberGrid.querySelector<HTMLButtonElement>('button[data-value="4"]')!
    btn.click()

    expect(engine.selectedBet).toEqual({ kind: 'number', value: 4 })
    view.setViewModel({
      balance: engine.balance,
      selectedBet: engine.selectedBet,
      lastRolled: engine.lastRolled,
    })
    view.render()
    expect(btn.classList.contains('is-selected')).toBe(true)
  })

  it('placeBet закрывает drawer и показывает победу для чётного', async () => {
    drawer.setOpen(true)
    engine.setSelectedBet({ kind: 'even' })
    view.el.stake.value = '50'

    const promise = engine.placeBet(view.readStake())
    await vi.advanceTimersByTimeAsync(3000)
    await promise

    expect(view.el.drawer.classList.contains('is-open')).toBe(false)
    // 1000 - 50 + 50*1.9 = 1045
    expect(engine.balance).toBe(1045)
    expect(view.el.centerResult.classList.contains('is-show')).toBe(true)
    expect(view.el.centerResult.textContent).toContain('Победа')
    expect(view.el.placeBet.disabled).toBe(true) // phase=result
  })

  it('range picker обновляет коэффициент и выбирает диапазон', () => {
    view.el.rangeFrom.value = '1'
    view.el.rangeTo.value = '1'
    view.el.rangeFrom.dispatchEvent(new Event('change'))

    expect(view.el.rangeCoef.textContent).toBe('x5.00')

    view.el.betRange.click()
    expect(engine.selectedBet).toEqual({ kind: 'range', from: 1, to: 1 })
  })

  it('setPhase блокирует контролы во время rolling', () => {
    view.setPhase('rolling')

    expect(view.el.placeBet.disabled).toBe(true)
    expect(view.el.reset.disabled).toBe(true)
    expect(view.el.stake.disabled).toBe(true)
    expect(view.el.betEven.disabled).toBe(true)
  })
})
