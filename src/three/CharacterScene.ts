import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'

/**
 * Ключи анимаций персонажа, которые поддерживает приложение
 */
type AnimKey = 'idle' | 'think' | 'win' | 'lose'

/**
 * Ограничивает значение в диапазоне [0, 1]
 */
function clamp01(n: number) {
  return Math.max(0, Math.min(1, n))
}

/**
 * Настройки сцены с персонажем
 */
type CharacterSceneOptions = {
  /**
   * URL к GLB-модели (например, `/assets/.../character.glb` с учётом `base` для GitHub Pages)
   */
  modelUrl: string
  /**
   * Имена клипов внутри GLB (как они называются в `gltf.animations`)
   * Соответствие: ключи `AnimKey` -> имя клипа в модели
   */
  animationNames: Record<AnimKey, string>

  /**
   * Колбэк прогресса загрузки модели
   * Значение `progress01` от 0 до 1
   */
  onProgress?: (progress01: number) => void

  /**
   * Колбэк, который вызывается после того, как модель загружена и созданы animation actions
   * Можно использовать для скрытия оверлея загрузки
   */
  onReady?: () => void
}

/**
 * Инкапсулирует Three.js сцену:
 * - создаёт `WebGLRenderer` внутри заданного контейнера
 * - грузит `GLB` и `AnimationMixer`
 * - управляет анимациями персонажа через `play()`
 *
 * В приложении это используется как "прослойка" между игровой логикой и 3D-рендером
 */
export class CharacterScene {
  private readonly container: HTMLElement
  private readonly opts: CharacterSceneOptions

  private readonly scene = new THREE.Scene()
  private readonly camera = new THREE.PerspectiveCamera(35, 1, 0.01, 100)
  private readonly renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  private readonly clock = new THREE.Clock()
  private readonly resizeObserver: ResizeObserver

  private mixer: THREE.AnimationMixer | null = null
  private actions = new Map<AnimKey, THREE.AnimationAction>()
  private currentKey: AnimKey | null = null
  private hasPlayedOnce = false

  private raf = 0

  /**
   * @param container Контейнер DOM, куда будет добавлен canvas рендера
   * @param opts Настройки загрузки модели и маппинга имён клипов
   */
  constructor(container: HTMLElement, opts: CharacterSceneOptions) {
    this.container = container
    this.opts = opts

    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.15
    this.renderer.shadowMap.enabled = false
    this.renderer.setClearColor(0x000000, 0)

    this.container.append(this.renderer.domElement)

    this.scene.add(new THREE.AmbientLight(0xffffff, 0.95))

    const hemi = new THREE.HemisphereLight(0xe9eefc, 0x0b0e14, 0.55)
    this.scene.add(hemi)

    const key = new THREE.DirectionalLight(0xffffff, 1.1)
    key.position.set(2.5, 3.5, 2.5)
    this.scene.add(key)

    const fill = new THREE.DirectionalLight(0xffffff, 0.55)
    fill.position.set(-2.2, 2.4, 2.0)
    this.scene.add(fill)

    const rim = new THREE.DirectionalLight(0x7c5cff, 0.7)
    rim.position.set(-3.0, 2.0, -2.0)
    this.scene.add(rim)

    this.camera.position.set(0, 1.25, 3.2)
    this.camera.lookAt(0, 1.1, 0)

    this.resizeObserver = new ResizeObserver(() => this.resize())
    this.resizeObserver.observe(this.container)
    this.resize()

    void this.load()
    this.loop()
  }

  /**
   * Плавно переключает анимацию персонажа
   *
   * Используется cross-fade, чтобы переход был мягким
   * В первый запуск fade не делается, чтобы не было “рывка” стартовой позы
   */
  play(key: AnimKey) {
    if (!this.mixer) {
      this.currentKey = key

      return
    }

    const next = this.actions.get(key)

    if (!next) {
      return
    }

    if (this.currentKey === key && this.hasPlayedOnce) {
      return
    }

    const prev = this.currentKey ? this.actions.get(this.currentKey) : null
    this.currentKey = key

    next.reset()
    next.enabled = true
    next.setEffectiveTimeScale(1)
    next.setEffectiveWeight(1)

    const fade = this.hasPlayedOnce ? 0.35 : 0.0
    if (prev && prev !== next) {
      prev.crossFadeTo(next, fade, false)
    } else {
      next.fadeIn(fade)
    }

    next.play()

    this.mixer.update(0)
    this.hasPlayedOnce = true
  }

  /**
   * Освобождает ресурсы рендера и анимаций
   * Вызывать при уничтожении сцены (если приложение когда-либо будет навигировать/пересоздавать UI)
   */
  dispose() {
    cancelAnimationFrame(this.raf)

    this.resizeObserver.disconnect()
    this.renderer.dispose()
    this.container.removeChild(this.renderer.domElement)
    this.mixer = null
    this.actions.clear()
  }

  /**
   * Загружает GLB, центрирует модель, подстраивает камеру,
   * создаёт `AnimationMixer` и `AnimationAction` для нужных клипов
   * Затем вызывает `play()` для стартовой анимации
   */
  private async load() {
    const loader = new GLTFLoader()
    loader.setMeshoptDecoder(MeshoptDecoder)

    const gltf = await new Promise<Awaited<ReturnType<GLTFLoader['loadAsync']>>>((resolve, reject) => {
      loader.load(
        this.opts.modelUrl,
        (g) => resolve(g),
        (evt) => {
          if (!this.opts.onProgress) {
            return
          }
          
          if (evt.total && evt.total > 0) {
            this.opts.onProgress(clamp01(evt.loaded / evt.total))
          } else {
            // Если сервер не отдаёт total, просто слегка “двигаем” прогресс
            this.opts.onProgress(Math.min(0.95, evt.loaded > 0 ? 0.5 : 0.1))
          }
        },
        (err) => reject(err),
      )
    })
    this.opts.onProgress?.(1)
    this.scene.add(gltf.scene)

    // Центрируем и подбираем кадрирование под модель
    const box = new THREE.Box3().setFromObject(gltf.scene)
    const size = box.getSize(new THREE.Vector3())
    const center = box.getCenter(new THREE.Vector3())

    gltf.scene.position.sub(center)

    const height = Math.max(0.001, size.y)
    const targetY = height * 0.5

    gltf.scene.position.y += targetY

    // Простой пьедестал/колонна под персонажем
    const postBox = new THREE.Box3().setFromObject(gltf.scene)
    const minY = postBox.min.y
    const pedestalGroup = new THREE.Group()

    pedestalGroup.position.set(0, 0, 0)

    const baseH = Math.max(0.08, height * 0.06)
    const baseR = Math.max(0.35, Math.max(size.x, size.z) * 0.55)
    const columnH = Math.max(2.5, height * 2.2)
    const columnR = Math.max(0.14, baseR * 0.28)

    const mat = new THREE.MeshStandardMaterial({
      color: 0xcfd5e3,
      metalness: 0.05,
      roughness: 0.88,
      emissive: new THREE.Color(0x0b1020),
      emissiveIntensity: 0.06,
    })

    const base = new THREE.Mesh(new THREE.CylinderGeometry(baseR, baseR * 1.06, baseH, 64), mat)

    base.position.y = minY - baseH * 0.5
    pedestalGroup.add(base)

    const column = new THREE.Mesh(new THREE.CylinderGeometry(columnR, columnR * 1.08, columnH, 48), mat)

    column.position.y = base.position.y - baseH * 0.5 - columnH * 0.5
    pedestalGroup.add(column)

    const glow = new THREE.PointLight(0x7c5cff, 0.55, baseR * 6, 2)

    glow.position.set(0, minY + baseH * 0.2, baseR * 0.4)
    pedestalGroup.add(glow)

    this.scene.add(pedestalGroup)

    const radius = Math.max(size.x, size.y, size.z) * 0.65
    const dist = radius / Math.tan(THREE.MathUtils.degToRad(this.camera.fov * 0.5))

    this.camera.position.set(0, targetY * 1.05, dist * 1.25)
    this.camera.lookAt(0, targetY, 0)

    this.mixer = new THREE.AnimationMixer(gltf.scene)
    this.actions.clear()

    const clipsByName = new Map(gltf.animations.map((c: THREE.AnimationClip) => [c.name, c] as const))
    const getClip = (wanted: string) => clipsByName.get(wanted) ?? null

    const setAction = (key: AnimKey, clipName: string) => {
      const clip = getClip(clipName)
      if (!clip || !this.mixer) {
        return
      }

      const action = this.mixer.clipAction(clip)

      action.enabled = true
      action.clampWhenFinished = false
      action.loop = THREE.LoopRepeat
      action.stop()

      this.actions.set(key, action)
    }

    setAction('idle', this.opts.animationNames.idle)
    setAction('think', this.opts.animationNames.think)
    setAction('win', this.opts.animationNames.win)
    setAction('lose', this.opts.animationNames.lose)

    // Фолбэк: если нужных клипов нет — берём первый доступный
    if (!this.actions.get('idle') && gltf.animations[0] && this.mixer) {
      this.actions.set('idle', this.mixer.clipAction(gltf.animations[0]))
    }

    this.play(this.currentKey ?? 'idle')
    this.opts.onReady?.()
  }

  /**
   * Основной render-loop. Обновляет `mixer` и перерисовывает сцену
   */
  private loop = () => {
    this.raf = requestAnimationFrame(this.loop)
    const dt = this.clock.getDelta()
    this.mixer?.update(dt)
    this.renderer.render(this.scene, this.camera)
  }

  /**
   * Подстраивает размеры canvas и параметры камеры под контейнер
   * Вызывается через `ResizeObserver`
   */
  private resize() {
    const w = Math.max(1, this.container.clientWidth)
    const h = Math.max(1, this.container.clientHeight)
    this.camera.aspect = w / h
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(w, h, false)
  }
}

