/**
 * Управляет выезжающей панелью справа (мобильная панель ставок)
 */
export class DrawerController {
  /** Открыта ли панель */
  private open = false
  /** Панель */
  private readonly drawer: HTMLElement
  /** Фон панели */
  private readonly backdrop: HTMLElement
  /** Кнопка открытия панели */
  private readonly openButton: HTMLButtonElement
  /** Кнопка закрытия панели */
  private readonly closeButton: HTMLButtonElement

  constructor(
    drawer: HTMLElement,
    backdrop: HTMLElement,
    openButton: HTMLButtonElement,
    closeButton: HTMLButtonElement,
  ) {
    this.drawer = drawer
    this.backdrop = backdrop
    this.openButton = openButton
    this.closeButton = closeButton
  }

  /**
   * Подключает обработчики открытия/закрытия
   */
  attach() {
    this.openButton.addEventListener('click', () => this.setOpen(true))
    this.backdrop.addEventListener('click', () => this.setOpen(false))
    this.closeButton.addEventListener('click', () => this.setOpen(false))
  }

  /**
   * Открывает/закрывает drawer
   */
  setOpen(next: boolean) {
    this.open = next
    this.drawer.classList.toggle('is-open', this.open)
    this.drawer.setAttribute('aria-hidden', this.open ? 'false' : 'true')
  }
}

