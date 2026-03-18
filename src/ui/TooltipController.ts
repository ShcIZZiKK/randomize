/**
 * Управляет подсказками-тулипами
 *
 * На десктопе: тултип открывается по hover/focus через CSS
 * На мобильных: нажатие на “?” переключает класс `is-open`, чтобы показать тултип
 */
export class TooltipController {
  /** Список кнопок с атрибутом data-tooltip */
  private readonly buttons: HTMLButtonElement[]
  /** Корневой элемент */
  private readonly root: ParentNode

  /**
   * Конструктор класса TooltipController
   * @param root - Корневой элемент
   */
  constructor(root: ParentNode = document) {
    this.root = root
    this.buttons = Array.from(this.root.querySelectorAll<HTMLButtonElement>('button[data-tooltip]'))
  }

  /**
   * Подключает обработчики клика для мобильного режима (toggle)
   */
  attach() {
    for (const btn of this.buttons) {
      btn.addEventListener('click', (e) => {
        e.preventDefault()

        const id = btn.dataset.tooltip

        if (!id) {
          return
        }

        const body = document.querySelector<HTMLElement>(`[data-tooltip-body="${id}"]`)

        if (!body) {
          return
        }

        body.classList.toggle('is-open')
      })
    }

    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement | null

      if (!target) {
        return
      }

      if (target.closest('button[data-tooltip]') || target.closest('[data-tooltip-body]')) {
        return
      }
      
      for (const tip of Array.from(document.querySelectorAll<HTMLElement>('[data-tooltip-body].is-open'))) {
        tip.classList.remove('is-open')
      }
    })
  }
}

