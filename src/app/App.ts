import { CharacterScene } from '../three/CharacterScene'
import { BetEngine } from '../game/BetEngine'
import { Roller } from '../game/Roller'
import { appTemplate } from '../ui/template'
import { AppView } from '../ui/AppView'
import { TooltipController } from '../ui/TooltipController'
import { DrawerController } from '../ui/DrawerController'

/**
 * Корневой класс приложения
 *
 * Ответственность:
 * - рендерит статический HTML-шаблон
 * - связывает события UI с игровым движком
 * - интегрирует 3D-сцену персонажа с состояниями игры
 */
export class App {
  /** Основной элемент приложения */
  private readonly view: AppView
  /** Игровой движок */
  private readonly engine: BetEngine
  /** Контроллер выезжающей панели ставок */
  private readonly drawer: DrawerController
  /** Контроллер всплывающих подсказок */
  private readonly tooltips: TooltipController
  /** 3D-сцена персонажа */
  private readonly character: CharacterScene
  /** Корневой элемент приложения */
  private readonly appRoot: HTMLElement

  /**
   * Конструктор класса App
   * @param appRoot - Корневой элемент приложения
   */
  constructor(appRoot: HTMLElement) {
    this.appRoot = appRoot
    this.appRoot.innerHTML = appTemplate()

    /** Основной элемент приложения */
    this.view = new AppView(this.appRoot)
    /** Контроллер всплывающих подсказок */
    this.tooltips = new TooltipController(this.appRoot)
    /** Контроллер выезжающей панели ставок */
    this.drawer = new DrawerController(
      this.view.el.drawer,
      this.view.el.drawerBackdrop,
      this.view.el.openBets,
      this.view.el.closeBets
    )

    /** 3D-сцена создаётся после шаблона, чтобы контейнер canvas уже существовал */
    this.character = new CharacterScene(this.view.el.stageCanvas, {
      // Учитываем базовый URL для GitHub Pages (Vite base: "/randomize/")
      modelUrl: `${import.meta.env.BASE_URL}assets/characters/character.glb`,
      animationNames: {
        idle: 'Idle',
        think: 'Think',
        win: 'ArmGesture',
        lose: 'Defeated',
      },
      onProgress: (progress) => this.view.setLoadingProgress(progress),
      onReady: () => this.view.finishLoading()
    })

    /** Генератор случайных чисел */
    const roller = new Roller(() => Math.floor(Math.random() * 10) + 1)

    /** Игровой движок */
    this.engine = new BetEngine({
      roller,
      onRender: () => {
        this.view.setViewModel({
          balance: this.engine.balance,
          selectedBet: this.engine.selectedBet,
          lastRolled: this.engine.lastRolled,
        })
        this.view.render()
      },
      onMessage: (message, variant) => this.view.setResult(message, variant),
      onRollSub: (text) => this.view.setRollSub(text),
      onCharacterAnim: (animation) => this.character.play(animation),
      onRollValue: (value) => {
        this.engine.lastRolled = value
      },
      onPhase: (phase) => this.view.setPhase(phase),
      onBetPlaced: () => this.drawer.setOpen(false)
    })
  }

  /**
   * Подключает обработчики событий и переводит приложение в начальное состояние
   */
  start() {
    this.tooltips.attach()
    this.drawer.attach()

    /** Построить сетку чисел */
    this.view.buildNumberGrid((value) => this.engine.setSelectedBet({ kind: 'number', value }))
    /** Построить диапазон */
    this.view.buildRangePicker((from, to) => this.engine.setSelectedBet({ kind: 'range', from, to }))

    /** Установить начальное состояние */
    this.engine.phase = 'idle'
    this.view.setRollSub('Выберите ставку и нажмите “Ставка”')
    this.character.play('idle')

    /** Обработчики нажатий на кнопки выбора типа ставки */
    this.view.el.betLt5.addEventListener('click', () => this.engine.setSelectedBet({ kind: 'lt5' }))
    this.view.el.betGt5.addEventListener('click', () => this.engine.setSelectedBet({ kind: 'gt5' }))
    this.view.el.betEven.addEventListener('click', () => this.engine.setSelectedBet({ kind: 'even' }))
    this.view.el.betOdd.addEventListener('click', () => this.engine.setSelectedBet({ kind: 'odd' }))
    this.view.el.betPrime.addEventListener('click', () => this.engine.setSelectedBet({ kind: 'prime' }))

    /** Обработчики нажатий на кнопки основных действий */
    this.view.el.placeBet.addEventListener('click', () => void this.engine.placeBet(this.view.readStake()))
    this.view.el.reset.addEventListener('click', () => this.engine.reset())
    this.view.el.stakeMax.addEventListener('click', () => {
      this.view.el.stake.value = String(Math.floor(this.engine.balance * 100) / 100)
    })

    /** Первичный рендер */
    this.engine.reset()
  }
}

