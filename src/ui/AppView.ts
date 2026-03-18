import { clamp } from '../lib/math'
import { formatMoney } from '../lib/money'
import type { SelectedBet } from '../game/bets'
import { rangeMultiplier } from '../game/bets'

export type ResultVariant = 'good' | 'bad' | 'neutral'
export type Phase = 'idle' | 'rolling' | 'result'

/**
 * Тонкий слой UI:
 * - читает/пишет DOM
 * - даёт методы для рендера выбора/баланса/ролла/результата
 * - предоставляет “хуки” событий для контроллера `App`
 */
export class AppView {
  /** Элементы UI */
  readonly el: {
    /** Canvas для 3D-сцены */
    stageCanvas: HTMLDivElement
    /** Значение выпавшего числа */
    rollValue: HTMLDivElement
    /** Подпись под числом */
    rollSub: HTMLDivElement
    /** Центральный оверлей результата */
    centerResult: HTMLDivElement
    /** Значение баланса */
    balanceValue: HTMLSpanElement
    /** Инпут для размера ставки */
    stake: HTMLInputElement
    /** Кнопка максимальной ставки */
    stakeMax: HTMLButtonElement
    /** Сетка чисел */
    numberGrid: HTMLDivElement
    /** Кнопка ставки на число меньше 5 */
    betLt5: HTMLButtonElement
    /** Кнопка ставки на число больше 5 */
    betGt5: HTMLButtonElement
    /** Кнопка ставки на чётное число */
    betEven: HTMLButtonElement
    /** Кнопка ставки на нечётное число */
    betOdd: HTMLButtonElement
    /** Кнопка ставки на простое число */
    betPrime: HTMLButtonElement
    /** Кнопка ставки на диапазон */
    betRange: HTMLButtonElement
    /** Выбор начала диапазона */
    rangeFrom: HTMLSelectElement
    /** Выбор конца диапазона */
    rangeTo: HTMLSelectElement
    /** Коэффициент ставки на диапазон */
    rangeCoef: HTMLSpanElement
    /** Панель диапазона */
    rangeBet: HTMLDivElement
    /** Кнопка ставки */
    placeBet: HTMLButtonElement
    /** Кнопка сброса */
    reset: HTMLButtonElement
    result: HTMLDivElement
    /** Кнопка открытия панели ставок */
    openBets: HTMLButtonElement
    /** Панель ставок */
    drawer: HTMLDivElement
    /** Фон панели ставок */
    drawerBackdrop: HTMLDivElement
    /** Кнопка закрытия панели ставок */
    closeBets: HTMLButtonElement
    /** Оверлей загрузки */
    loading: HTMLDivElement
    /** Заполнение оверля загрузки */
    loadingFill: HTMLDivElement
    /** Процент загрузки */
    loadingPct: HTMLDivElement
  }

  /** Текущий выбор — используется только для подсветки в UI */
  private selectedBet: SelectedBet | null = null
  /** Последнее выпавшее число */
  private lastRolled: number | null = null
  /** Баланс */
  private balance = 0
  /** Корневой элемент */
  private readonly root: ParentNode

  /**
   * Конструктор класса AppView
   * @param root - Корневой элемент
   */

  constructor(root: ParentNode = document) {
    this.root = root
    
    const q = <T extends Element>(sel: string) => {
      const found = this.root.querySelector<T>(sel)

      if (!found) {
        throw new Error(`Missing element: ${sel}`)
      }

      return found
    }

    this.el = {
      stageCanvas: q<HTMLDivElement>('#stage-canvas'),
      rollValue: q<HTMLDivElement>('#rollValue'),
      rollSub: q<HTMLDivElement>('#rollSub'),
      centerResult: q<HTMLDivElement>('#centerResult'),
      balanceValue: q<HTMLSpanElement>('#balanceValue'),
      stake: q<HTMLInputElement>('#stake'),
      stakeMax: q<HTMLButtonElement>('#stakeMax'),
      numberGrid: q<HTMLDivElement>('#numberGrid'),
      betLt5: q<HTMLButtonElement>('#betLt5'),
      betGt5: q<HTMLButtonElement>('#betGt5'),
      betEven: q<HTMLButtonElement>('#betEven'),
      betOdd: q<HTMLButtonElement>('#betOdd'),
      betPrime: q<HTMLButtonElement>('#betPrime'),
      betRange: q<HTMLButtonElement>('#betRange'),
      rangeFrom: q<HTMLSelectElement>('#rangeFrom'),
      rangeTo: q<HTMLSelectElement>('#rangeTo'),
      rangeCoef: q<HTMLSpanElement>('#rangeCoef'),
      rangeBet: q<HTMLDivElement>('#rangeBet'),
      placeBet: q<HTMLButtonElement>('#placeBet'),
      reset: q<HTMLButtonElement>('#reset'),
      result: q<HTMLDivElement>('#result'),
      openBets: q<HTMLButtonElement>('#openBets'),
      drawer: q<HTMLDivElement>('#drawer'),
      drawerBackdrop: q<HTMLDivElement>('#drawerBackdrop'),
      closeBets: q<HTMLButtonElement>('#closeBets'),
      loading: q<HTMLDivElement>('#loading'),
      loadingFill: q<HTMLDivElement>('#loadingFill'),
      loadingPct: q<HTMLDivElement>('#loadingPct'),
    }
  }

  /**
   * Создаёт сетку кнопок чисел (1..10).
   */
  buildNumberGrid(onPick: (value: number) => void) {
    const frag = document.createDocumentFragment()

    for (let i = 1; i <= 10; i++) {
      const btn = document.createElement('button')

      btn.type = 'button'
      btn.className = 'chip'
      btn.dataset.bet = 'number'
      btn.dataset.value = String(i)
      btn.textContent = String(i)
      btn.addEventListener('click', () => onPick(i))
      frag.append(btn)
    }

    this.el.numberGrid.append(frag)
  }

  /**
   * Создаёт селекты диапазона (1..10) и связывает отображение коэффициента
   */
  buildRangePicker(onPick: (from: number, to: number) => void) {
    const addOptions = (select: HTMLSelectElement) => {
      const frag = document.createDocumentFragment()

      for (let i = 1; i <= 10; i++) {
        const opt = document.createElement('option')
        opt.value = String(i)
        opt.textContent = String(i)
        frag.append(opt)
      }

      select.append(frag)
    }

    addOptions(this.el.rangeFrom)
    addOptions(this.el.rangeTo)
 
    this.el.rangeFrom.value = '1'
    this.el.rangeTo.value = '3'

    const updateCoef = () => {
      const from = clamp(Number(this.el.rangeFrom.value), 1, 10)
      const to = clamp(Number(this.el.rangeTo.value), 1, 10)
      const a = Math.min(from, to)
      const b = Math.max(from, to)
      const count = b - a + 1
      this.el.rangeCoef.textContent = `x${rangeMultiplier(count).toFixed(2)}`
    }

    updateCoef()

    this.el.rangeFrom.addEventListener('change', updateCoef)
    this.el.rangeTo.addEventListener('change', updateCoef)
    this.el.betRange.addEventListener('click', () => {
      const from = clamp(Number(this.el.rangeFrom.value), 1, 10)
      const to = clamp(Number(this.el.rangeTo.value), 1, 10)
      onPick(from, to)
    })
  }

  /**
   * Читает размер ставки из input (поддерживает запятую), округляет вниз до 2 знаков
   */
  readStake(): number {
    const raw = this.el.stake.value.replace(',', '.').trim()
    const n = Number(raw)

    if (!Number.isFinite(n)) {
      return 0
    }

    return clamp(Math.floor(n * 100) / 100, 0, 1_000_000)
  }

  /**
   * Обновляет view model (данные для рендера)
   */
  setViewModel(vm: { balance: number; selectedBet: SelectedBet | null; lastRolled: number | null }) {
    this.balance = vm.balance
    this.selectedBet = vm.selectedBet
    this.lastRolled = vm.lastRolled
  }

  /**
   * Рендерит баланс, выпавшее число и подсветку выбранной ставки
   */
  render() {
    this.el.balanceValue.textContent = formatMoney(this.balance)
    this.el.rollValue.textContent = this.lastRolled === null ? '—' : String(this.lastRolled)

    /** Список чипов для подсветки */
    const chips = [
      ...Array.from(this.el.numberGrid.querySelectorAll<HTMLButtonElement>('button[data-bet="number"]')),
      this.el.betLt5,
      this.el.betGt5,
      this.el.betEven,
      this.el.betOdd,
      this.el.betPrime,
    ]
    for (const chip of chips) {
      chip.classList.remove('is-selected')
    }

    this.el.rangeBet.classList.remove('is-selected')

    if (!this.selectedBet) {
      return
    }

    /** Обработка выбранной ставки */
    switch (this.selectedBet.kind) {
      case 'number': {
        const btn = this.el.numberGrid.querySelector<HTMLButtonElement>(
          `button[data-value="${this.selectedBet.value}"]`,
        )
        btn?.classList.add('is-selected')
        break
      }
      case 'lt5':
        this.el.betLt5.classList.add('is-selected')
        break
      case 'gt5':
        this.el.betGt5.classList.add('is-selected')
        break
      case 'even':
        this.el.betEven.classList.add('is-selected')
        break
      case 'odd':
        this.el.betOdd.classList.add('is-selected')
        break
      case 'prime':
        this.el.betPrime.classList.add('is-selected')
        break
      case 'range':
        this.el.rangeBet.classList.add('is-selected')
        break
    }
  }

  /**
   * Обновляет сообщение результата и в панели, и в центральном оверлее
   */
  setResult(message: string, variant: ResultVariant) {
    this.el.result.textContent = message
    this.el.result.className = `result result--${variant}`

    if (!message || variant === 'neutral') {
      this.el.centerResult.textContent = ''
      this.el.centerResult.className = 'centerResult'

      return
    }

    this.el.centerResult.textContent = message
    this.el.centerResult.className = `centerResult centerResult--${variant} is-show`
  }

  /**
   * Управляет подписью под большим числом
   */
  setRollSub(text: string) {
    this.el.rollSub.textContent = text
  }

  /**
   * Включает/выключает элементы управления в зависимости от фазы
   */
  setPhase(phase: Phase) {
    const locked = phase !== 'idle'
    this.el.placeBet.disabled = locked
    this.el.reset.disabled = phase === 'rolling'
    this.el.stake.disabled = locked
    this.el.stakeMax.disabled = locked

    for (const btn of Array.from(this.el.numberGrid.querySelectorAll('button'))) {
      btn.disabled = locked
    }
    
    this.el.betLt5.disabled = locked
    this.el.betGt5.disabled = locked
    this.el.betEven.disabled = locked
    this.el.betOdd.disabled = locked
    this.el.betPrime.disabled = locked
    this.el.betRange.disabled = locked
    this.el.rangeFrom.disabled = locked
    this.el.rangeTo.disabled = locked
  }

  /**
   * Обновляет UI загрузки по прогрессу загрузки GLB
   */
  setLoadingProgress(progress01: number) {
    const pct = Math.round(progress01 * 100)
    this.el.loadingFill.style.width = `${pct}%`
    this.el.loadingPct.textContent = `${pct}%`
  }

  /**
   * Скрывает оверлей загрузки
   */
  finishLoading() {
    this.el.loading.classList.add('is-done')
    window.setTimeout(() => this.el.loading.remove(), 450)
  }
}

