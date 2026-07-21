import { beforeEach, describe, expect, it } from 'vitest'
import { TooltipController } from './TooltipController'

describe('TooltipController (integration)', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <button type="button" data-tooltip="tip-a" id="help">?</button>
      <div data-tooltip-body="tip-a" id="tip">hint</div>
      <button type="button" id="outside">outside</button>
    `
  })

  it('по клику на ? переключает is-open', () => {
    const controller = new TooltipController(document)
    controller.attach()

    const help = document.querySelector<HTMLButtonElement>('#help')!
    const tip = document.querySelector<HTMLElement>('#tip')!

    help.click()
    expect(tip.classList.contains('is-open')).toBe(true)

    help.click()
    expect(tip.classList.contains('is-open')).toBe(false)
  })

  it('клик вне тултипа закрывает открытые подсказки', () => {
    const controller = new TooltipController(document)
    controller.attach()

    const help = document.querySelector<HTMLButtonElement>('#help')!
    const tip = document.querySelector<HTMLElement>('#tip')!
    const outside = document.querySelector<HTMLButtonElement>('#outside')!

    help.click()
    expect(tip.classList.contains('is-open')).toBe(true)

    outside.click()
    expect(tip.classList.contains('is-open')).toBe(false)
  })
})
