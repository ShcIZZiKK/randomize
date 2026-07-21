import { beforeEach, describe, expect, it } from 'vitest'
import { DrawerController } from './DrawerController'

describe('DrawerController (integration)', () => {
  let drawer: HTMLElement
  let backdrop: HTMLElement
  let openButton: HTMLButtonElement
  let closeButton: HTMLButtonElement
  let controller: DrawerController

  beforeEach(() => {
    document.body.innerHTML = `
      <div id="drawer" aria-hidden="true"></div>
      <div id="backdrop"></div>
      <button id="open" type="button">open</button>
      <button id="close" type="button">close</button>
    `

    drawer = document.querySelector('#drawer')!
    backdrop = document.querySelector('#backdrop')!
    openButton = document.querySelector('#open')!
    closeButton = document.querySelector('#close')!
    controller = new DrawerController(drawer, backdrop, openButton, closeButton)
    controller.attach()
  })

  it('открывает drawer по кнопке', () => {
    openButton.click()

    expect(drawer.classList.contains('is-open')).toBe(true)
    expect(drawer.getAttribute('aria-hidden')).toBe('false')
  })

  it('закрывает drawer по крестику и backdrop', () => {
    controller.setOpen(true)
    closeButton.click()
    expect(drawer.classList.contains('is-open')).toBe(false)

    controller.setOpen(true)
    backdrop.click()
    expect(drawer.getAttribute('aria-hidden')).toBe('true')
  })
})
