import './style.css'
import { App } from './app/App'

/**
 * Точка входа в браузере.
 *
 * Приложение устроено вокруг `App` как composition root.
 * `App` связывает UI + игровой движок + Three.js сцену персонажа.
 */
const root = document.querySelector<HTMLDivElement>('#app')
if (!root) throw new Error('Missing #app')

new App(root).start()

